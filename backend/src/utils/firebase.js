const admin = require('firebase-admin');

let serviceAccount;
try {
  if (process.env.FIREBASE_KEY) {
    console.log('📦 Using FIREBASE_KEY JSON string...');
    const rawKey = process.env.FIREBASE_KEY.replace(/\\n/g, '\n');
    serviceAccount = JSON.parse(process.env.FIREBASE_KEY.startsWith('{') ? process.env.FIREBASE_KEY : rawKey);
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    console.log('📋 Using individual FIREBASE_* environment variables...');
    serviceAccount = {
      type: 'service_account',
      project_id: process.env.VITE_FIREBASE_PROJECT_ID || 'planzio-0529',
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };
  } else {
    throw new Error('No valid Firebase credentials found (FIREBASE_KEY or FIREBASE_PRIVATE_KEY/CLIENT_EMAIL).');
  }
} catch (error) {
  console.error('❌ Firebase credential error:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();
const storage = admin.storage();

module.exports = { admin, db, storage };
