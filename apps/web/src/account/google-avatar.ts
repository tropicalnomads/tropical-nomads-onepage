import { saveAvatarFile, updateAccounts } from 'tropical-nomads-api/accounts';
import { apiOrigin } from '../api-origin.ts';
import { callPrivate } from '../remote-store.ts';
import { readGooglePicture } from './google-picture';

export async function storeGooglePicture(sub: string, pictureUrl: string, root?: string, sessionToken?: string): Promise<void> {
  try {
    const bytes = await readGooglePicture(pictureUrl);
    if (!bytes) {
      return;
    }
    const now = new Date().toISOString();
    if (apiOrigin() && root === undefined) {
      await callPrivate('save-avatar', { sub, avatarBase64: Buffer.from(bytes).toString('base64') }, sessionToken);
      return;
    }
    await updateAccounts((current) => saveAvatarFile(current, sub, bytes, now), root);
  } catch {
    return;
  }
}
