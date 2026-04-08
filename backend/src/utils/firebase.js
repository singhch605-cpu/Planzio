const admin = require('firebase-admin');

let serviceAccount;
try {
  if (!process.env.FIREBASE_KEY) {
    throw new Error('FIREBASE_KEY environment variable is missing.');
  }
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
} catch (error) {
  console.error('❌ Failed to parse FIREBASE_KEY:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();
const storage = admin.storage();

module.exports = { admin, db, storage };
