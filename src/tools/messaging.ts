import admin from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';

declare global {
  // eslint-disable-next-line no-var
  var firebaseMessaging: Messaging | undefined;
}

function createFirebaseMessaging(): Messaging {
  if (global.firebaseMessaging) return global.firebaseMessaging;
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIAL || '{}')
    ),
  });

  global.firebaseMessaging = admin.messaging();
  return global.firebaseMessaging;
}

export const messaging = createFirebaseMessaging();
