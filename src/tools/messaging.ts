import admin from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';
import { getSSMParams } from './ssm';

declare global {
  // eslint-disable-next-line no-var
  var firebaseMessaging: Messaging | undefined;
}

export async function createFirebaseMessaging(): Promise<Messaging> {
  if (global.firebaseMessaging) return global.firebaseMessaging;

  const name = 'coreservice';
  const rawCredential = (await getSSMParams('/firebase/coreservice')) || '{}';
  const credential = admin.credential.cert(JSON.parse(rawCredential));
  const app = admin.initializeApp({ credential }, name);
  global.firebaseMessaging = app.messaging();
  return global.firebaseMessaging;
}
