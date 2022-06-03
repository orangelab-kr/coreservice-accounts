import admin from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';

declare global {
  // eslint-disable-next-line no-var
  var firebaseMessaging: Messaging | undefined;
}

function createFirebaseMessaging(): Messaging {
  if (global.firebaseMessaging) return global.firebaseMessaging;

  const name = 'coreservice';
  const rawCredential = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIAL || '{}';
  const credential = admin.credential.cert(JSON.parse(rawCredential));
  const app = admin.initializeApp({ credential }, name);
  global.firebaseMessaging = app.messaging();
  return global.firebaseMessaging;
}

export const messaging = createFirebaseMessaging();
