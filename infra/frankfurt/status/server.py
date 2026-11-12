#!/usr/bin/env python3
"""Loopback page for Frankfurt host status. It runs fixed AWS CLI reads and returns no secret values."""

from __future__ import annotations

import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

REGION = "eu-central-1"
HOST = "127.0.0.1"
PORT = 8788
PAGE = Path(__file__).with_name("index.html")

Card = dict[str, Any]


def aws_json(args: list[str]) -> Any:
    completed = subprocess.run(
        ["aws", "--region", REGION, *args, "--output", "json"],
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        message = (completed.stderr or completed.stdout).strip()
        missing = (
            "DBInstanceNotFound",
            "RepositoryNotFoundException",
            "ClusterNotFoundException",
            "ServiceNotFoundException",
            "LoadBalancerNotFound",
            "ResourceNotFoundException",
            "NoSuchEntity",
            "NotFoundException",
        )
        if any(token in message for token in missing):
            return None
        raise RuntimeError(message.splitlines()[-1][:400])
    if not completed.stdout.strip():
        return None
    return json.loads(completed.stdout)


def card(name: str, tone: str, status: str, lines: list[dict[str, str]]) -> Card:
    return {"name": name, "tone": tone, "status": status, "lines": lines}


def missing(name: str) -> Card:
    return card(name, "missing", "not created", [])


def caller() -> dict[str, str]:
    data = aws_json(["sts", "get-caller-identity"])
    if not isinstance(data, dict):
        raise RuntimeError("caller identity is unavailable")
    arn = str(data.get("Arn", ""))
    account = str(data.get("Account", ""))
    if not arn.endswith(":user/tropical-nomads"):
        raise RuntimeError("caller is not the tropical-nomads user")
    expected = os.environ.get("EXPECTED_AWS_ACCOUNT", "")
    if expected and account != expected:
        raise RuntimeError("caller account does not match EXPECTED_AWS_ACCOUNT")
    return {"arn": arn, "account": account}


def identity() -> Card:
    who = caller()
    user = who["arn"].rsplit("/", 1)[-1]
    return card("Caller", "ready", user, [{"label": "Region", "value": REGION}])


def stacks() -> Card:
    data = aws_json(
        [
            "cloudformation",
            "list-stacks",
            "--stack-status-filter",
            "CREATE_IN_PROGRESS",
            "CREATE_FAILED",
            "CREATE_COMPLETE",
            "ROLLBACK_IN_PROGRESS",
            "ROLLBACK_FAILED",
            "ROLLBACK_COMPLETE",
            "UPDATE_IN_PROGRESS",
            "UPDATE_COMPLETE",
            "UPDATE_ROLLBACK_FAILED",
            "UPDATE_ROLLBACK_COMPLETE",
        ]
    )
    summaries = [
        item
        for item in (data or {}).get("StackSummaries", [])
        if str(item.get("StackName", "")).startswith("tn-frankfurt-")
    ]
    if not summaries:
        return missing("CloudFormation")
    lines = [{"label": item["StackName"], "value": item["StackStatus"]} for item in summaries]
    statuses = [item["StackStatus"] for item in summaries]
    if any("FAILED" in status or "ROLLBACK" in status for status in statuses):
        tone = "problem"
    elif any("PROGRESS" in status for status in statuses):
        tone = "pending"
    else:
        tone = "ready"
    return card("CloudFormation", tone, f"{len(summaries)} stacks", lines)


def network() -> Card:
    vpcs = aws_json(
        ["ec2", "describe-vpcs", "--filters", "Name=tag:Name,Values=tropical-nomads"]
    )
    vpc_rows = (vpcs or {}).get("Vpcs", [])
    if not vpc_rows:
        return missing("Network")
    subnets = aws_json(
        [
            "ec2",
            "describe-subnets",
            "--filters",
            "Name=tag:Name,Values=tropical-nomads-public-a,tropical-nomads-public-b,tropical-nomads-private-a,tropical-nomads-private-b",
        ]
    )
    nats = aws_json(
        ["ec2", "describe-nat-gateways", "--filter", "Name=tag:Name,Values=tropical-nomads"]
    )
    lines = [{"label": "VPC", "value": f"{vpc_rows[0].get('State')} {vpc_rows[0].get('CidrBlock')}"}]
    for subnet in (subnets or {}).get("Subnets", []):
        name = next((tag["Value"] for tag in subnet.get("Tags", []) if tag.get("Key") == "Name"), "subnet")
        lines.append({"label": name, "value": f"{subnet.get('State')} {subnet.get('CidrBlock')}"})
    live_nats = [item for item in (nats or {}).get("NatGateways", []) if item.get("State") != "deleted"]
    if not live_nats:
        lines.append({"label": "NAT", "value": "removed"})
        return card("Network", "ready", "no nat", lines)
    state = live_nats[0].get("State", "unknown")
    lines.append({"label": "NAT", "value": state})
    return card("Network", "problem", state, lines)


def security_groups() -> Card:
    data = aws_json(
        [
            "ec2",
            "describe-security-groups",
            "--filters",
            "Name=group-name,Values=tropical-nomads-alb,tropical-nomads-api,tropical-nomads-db",
        ]
    )
    groups = (data or {}).get("SecurityGroups", [])
    if not groups:
        return missing("Security groups")
    lines: list[dict[str, str]] = []
    open_database = False
    for group in groups:
        permissions = group.get("IpPermissions", [])
        if not permissions:
            lines.append({"label": group["GroupName"], "value": "no inbound"})
            continue
        for permission in permissions:
            port = permission.get("FromPort")
            cidrs = [item.get("CidrIp", "") for item in permission.get("IpRanges", [])]
            peers = [item.get("GroupId", "") for item in permission.get("UserIdGroupPairs", [])]
            source = ", ".join([item for item in cidrs + peers if item]) or "none"
            lines.append({"label": group["GroupName"], "value": f"{port} from {source}"})
            if port == 5432 and "0.0.0.0/0" in cidrs:
                open_database = True
    if open_database:
        return card("Security groups", "problem", "database open", lines)
    return card("Security groups", "ready", "private database", lines)


def database() -> Card:
    data = aws_json(
        [
            "rds",
            "describe-db-instances",
            "--db-instance-identifier",
            "tropical-nomads-frankfurt",
            "--query",
            "DBInstances[0].{Status:DBInstanceStatus,Public:PubliclyAccessible,Class:DBInstanceClass,MultiAZ:MultiAZ,AZ:AvailabilityZone,Engine:Engine,Version:EngineVersion,Encrypted:StorageEncrypted}",
        ]
    )
    if not isinstance(data, dict):
        return missing("Database")
    status = str(data.get("Status", "unknown"))
    public = bool(data.get("Public"))
    tone = "problem" if public else "ready" if status == "available" else "pending"
    lines = [
        {"label": "Class", "value": str(data.get("Class"))},
        {"label": "Engine", "value": f"{data.get('Engine')} {data.get('Version')}"},
        {"label": "Public", "value": str(public).lower()},
        {"label": "Multi-AZ", "value": str(bool(data.get("MultiAZ"))).lower()},
        {"label": "Zone", "value": str(data.get("AZ"))},
        {"label": "Encrypted", "value": str(bool(data.get("Encrypted"))).lower()},
    ]
    return card("Database", tone, status, lines)


def secret() -> Card:
    data = aws_json(["secretsmanager", "list-secrets"])
    names = []
    for item in (data or {}).get("SecretList", []):
        name = str(item.get("Name", ""))
        if name.startswith("rds!") or "tropical-nomads" in name:
            names.append(name)
    if not names:
        return missing("Database secret")
    return card(
        "Database secret",
        "ready",
        f"{len(names)} name",
        [{"label": "Name", "value": name} for name in names],
    )


def cognito() -> Card:
    data = aws_json(["cognito-idp", "list-user-pools", "--max-results", "60"])
    pools = (data or {}).get("UserPools", [])
    pool = next((item for item in pools if item.get("Name") == "tropical-nomads-web"), None)
    if pool is None:
        return missing("Cognito")
    pool_id = str(pool["Id"])
    providers = aws_json(["cognito-idp", "list-identity-providers", "--user-pool-id", pool_id])
    clients = aws_json(
        ["cognito-idp", "list-user-pool-clients", "--user-pool-id", pool_id, "--max-results", "10"]
    )
    groups = aws_json(["cognito-idp", "list-groups", "--user-pool-id", pool_id])
    provider_names = [item.get("ProviderName", "") for item in (providers or {}).get("Providers", [])]
    client_names = [item.get("ClientName", "") for item in (clients or {}).get("UserPoolClients", [])]
    group_names = [item.get("GroupName", "") for item in (groups or {}).get("Groups", [])]
    lines = [
        {"label": "Clients", "value": ", ".join(client_names) or "none"},
        {"label": "Groups", "value": ", ".join(group_names) or "none"},
        {"label": "Providers", "value": ", ".join(provider_names) or "email only"},
    ]
    return card("Cognito", "ready", "email sign-in", lines)


def amplify() -> Card:
    data = aws_json(["amplify", "list-apps"])
    apps = (data or {}).get("apps", [])
    app = next((item for item in apps if item.get("name") == "tropical-nomads-web"), None)
    if app is None:
        return missing("Amplify")
    domains = aws_json(["amplify", "list-domain-associations", "--app-id", str(app["appId"])])
    domain_names = [item.get("domainName", "") for item in (domains or {}).get("domainAssociations", [])]
    lines = [
        {"label": "Platform", "value": str(app.get("platform", ""))},
        {"label": "Domains", "value": ", ".join(domain_names) or "none"},
    ]
    tone = "problem" if domain_names else "ready"
    return card("Amplify", tone, "no production domain" if not domain_names else "domain attached", lines)


def repository() -> Card:
    data = aws_json(["ecr", "describe-repositories", "--repository-names", "tropical-nomads-api"])
    repos = (data or {}).get("repositories", [])
    if not repos:
        return missing("Image repository")
    images = aws_json(["ecr", "list-images", "--repository-name", "tropical-nomads-api"])
    count = len((images or {}).get("imageIds", []))
    return card("Image repository", "ready", f"{count} images", [{"label": "Name", "value": "tropical-nomads-api"}])


def front_door() -> Card:
    data = aws_json(["apigatewayv2", "get-apis"])
    apis = [item for item in (data or {}).get("Items", []) if item.get("Name") == "tropical-nomads-api"]
    if not apis:
        return missing("API front door")
    api = apis[0]
    endpoint = str(api.get("ApiEndpoint", ""))
    if endpoint.startswith("https://"):
        endpoint = endpoint[len("https://") :]
    lines = [
        {"label": "Type", "value": str(api.get("ProtocolType", ""))},
        {"label": "Endpoint", "value": endpoint},
    ]
    return card("API front door", "ready", "http api", lines)


def api_service() -> Card:
    clusters = aws_json(["ecs", "describe-clusters", "--clusters", "tropical-nomads"])
    described = (clusters or {}).get("clusters", [])
    if not described or described[0].get("status") != "ACTIVE":
        return missing("API service")
    services = aws_json(
        ["ecs", "describe-services", "--cluster", "tropical-nomads", "--services", "tropical-nomads-api"]
    )
    rows = (services or {}).get("services", [])
    if not rows:
        return card("API service", "pending", "cluster only", [{"label": "Cluster", "value": "ACTIVE"}])
    service = rows[0]
    status = str(service.get("status", "unknown"))
    running = int(service.get("runningCount", 0))
    desired = int(service.get("desiredCount", 0))
    lines = [
        {"label": "Running", "value": f"{running} of {desired}"},
        {"label": "Public IP", "value": "outbound" if str(((service.get("networkConfiguration") or {}).get("awsvpcConfiguration") or {}).get("assignPublicIp", "")).upper() == "ENABLED" else "disabled"},
    ]
    tone = "ready" if status == "ACTIVE" and running == desired and desired > 0 else "pending"
    return card("API service", tone, status, lines)


def logs() -> Card:
    data = aws_json(["logs", "describe-log-groups", "--log-group-name-prefix", "/tropical-nomads/api"])
    groups = (data or {}).get("logGroups", [])
    group = next((item for item in groups if item.get("logGroupName") == "/tropical-nomads/api"), None)
    if group is None:
        return missing("Logs")
    retention = group.get("retentionInDays", "none")
    return card("Logs", "ready", "30 days" if retention == 30 else str(retention), [{"label": "Group", "value": "/tropical-nomads/api"}])


CHECKS = {
    "identity": identity,
    "stacks": stacks,
    "network": network,
    "security-groups": security_groups,
    "database": database,
    "secret": secret,
    "cognito": cognito,
    "amplify": amplify,
    "repository": repository,
    "load-balancer": front_door,
    "api": api_service,
    "logs": logs,
}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/":
            body = PAGE.read_bytes()
            self._send(200, "text/html; charset=utf-8", body)
            return
        if path == "/api/all":
            payload = {"checks": [self._one(name) for name in CHECKS]}
            self._send(200, "application/json", json.dumps(payload).encode())
            return
        name = path.removeprefix("/api/")
        if name not in CHECKS:
            self._send(404, "application/json", b'{"status":"not found"}')
            return
        self._send(200, "application/json", json.dumps(self._one(name)).encode())

    def _one(self, name: str) -> Card:
        try:
            caller()
            return CHECKS[name]()
        except Exception as error:  # noqa: BLE001
            return card(name, "problem", "error", [{"label": "Detail", "value": str(error)[:400]}])

    def _send(self, status: int, content_type: str, body: bytes) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        return


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Frankfurt host status at http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
