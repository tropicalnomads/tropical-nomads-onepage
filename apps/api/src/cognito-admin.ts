import { AdminDeleteUserCommand, CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

const poolIdPattern = /^eu-central-1_[A-Za-z0-9]+$/;
const subjectPattern = /^[A-Za-z0-9_-]{1,128}$/;
const usernamePattern = /^[\w.@+-]{1,128}$/;

export interface CognitoUserDirectory {
  findUsername(poolId: string, sub: string): Promise<string | undefined>;
  deleteUsername(poolId: string, username: string): Promise<void>;
}

function missingUser(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'UserNotFoundException';
}

function awsDirectory(): CognitoUserDirectory {
  const client = new CognitoIdentityProviderClient({ region: 'eu-central-1' });
  return {
    async findUsername(poolId, sub) {
      const listed = await client.send(
        new ListUsersCommand({
          UserPoolId: poolId,
          Filter: `sub = "${sub}"`,
          Limit: 2,
        }),
      );
      const users = listed.Users ?? [];
      if (users.length === 0) {
        return undefined;
      }
      if (users.length > 1) {
        throw new Error('account was not deleted');
      }
      const username = users[0]?.Username;
      if (!username || !usernamePattern.test(username)) {
        throw new Error('account was not deleted');
      }
      return username;
    },
    async deleteUsername(poolId, username) {
      await client.send(new AdminDeleteUserCommand({ UserPoolId: poolId, Username: username }));
    },
  };
}

/**
 * Deletes the Cognito user for this subject, including a linked Google identity.
 * A missing pool skips the call. A missing user is already deleted.
 * Any other failure is thrown before local personal data is removed.
 */
export async function deleteCognitoAccount(
  sub: string,
  env: Record<string, string | undefined> = process.env,
  directory?: CognitoUserDirectory,
): Promise<void> {
  const poolId = env.COGNITO_USER_POOL_ID?.trim() ?? '';
  if (!poolIdPattern.test(poolId)) {
    return;
  }
  if (!subjectPattern.test(sub)) {
    throw new Error('account was not deleted');
  }
  const users = directory ?? awsDirectory();
  try {
    const username = await users.findUsername(poolId, sub);
    if (!username) {
      return;
    }
    await users.deleteUsername(poolId, username);
  } catch (error) {
    if (missingUser(error)) {
      return;
    }
    if (error instanceof Error && error.message === 'account was not deleted') {
      throw error;
    }
    throw new Error('account was not deleted');
  }
}
