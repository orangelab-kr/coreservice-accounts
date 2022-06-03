import admin, { firestore } from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';

declare global {
  // eslint-disable-next-line no-var
  var legacyFirebaseFirestore: firestore.Firestore | undefined;
}

function createLegacyFirestore(): firestore.Firestore {
  if (global.legacyFirebaseFirestore) return global.legacyFirebaseFirestore;

  const name = 'legacy';
  const rawCredential =
    process.env.LEGACY_GOOGLE_SERVICE_ACCOUNT_CREDENTIAL || '{}';
  const credential = admin.credential.cert(JSON.parse(rawCredential));
  const app = admin.initializeApp({ credential }, name);
  global.legacyFirebaseFirestore = app.firestore();
  return global.legacyFirebaseFirestore;
}

export const legacyFirestore = createLegacyFirestore();
