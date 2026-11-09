FROM amazonlinux:2023
RUN dnf install -y awscli && \
  curl -fsSL -o /tmp/session-manager-plugin.rpm https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm && \
  dnf install -y /tmp/session-manager-plugin.rpm && \
  rm /tmp/session-manager-plugin.rpm
ENTRYPOINT ["aws"]
