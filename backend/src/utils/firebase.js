const admin = require('firebase-admin');

let serviceAccount;
try {
  if (!process.env.FIREBASE_KEY) {
    throw new Error('FIREBASE_KEY environment variable is missing.');
  }
  // Try to clean up the string if it contains literal \n characters
  const rawKey = process.env.FIREBASE_KEY.replace(/\\n/g, '\n');
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY.startsWith('{') ? process.env.FIREBASE_KEY : rawKey);
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
