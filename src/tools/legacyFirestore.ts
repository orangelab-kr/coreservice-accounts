import admin, { firestore } from 'firebase-admin';
import { getSSMParams } from './ssm';

declare global {
  // eslint-disable-next-line no-var
  var legacyFirebaseFirestore: firestore.Firestore | undefined;
}

export async function createLegacyFirestore(): Promise<firestore.Firestore> {
  if (global.legacyFirebaseFirestore) return global.legacyFirebaseFirestore;

  const name = 'legacy';
  const rawCredential = (await getSSMParams('/firebase/legacy')) || '{}';
  const credential = admin.credential.cert(JSON.parse(rawCredential));
  const app = admin.initializeApp({ credential }, name);
  global.legacyFirebaseFirestore = app.firestore();
  return global.legacyFirebaseFirestore;
}
