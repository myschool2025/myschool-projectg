import 'dotenv/config';
import fs from 'fs';

console.log('Testing server configuration...');

// Test environment variables
console.log('Environment variables:');
console.log('- PORT:', process.env.PORT || '5000 (default)');
console.log('- GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Not set');
console.log('- GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Not set');
console.log('- BULKSMSBD_API_KEY:', process.env.BULKSMSBD_API_KEY ? 'Set' : 'Not set');
console.log('- BULKSMSBD_SENDER_ID:', process.env.BULKSMSBD_SENDER_ID ? 'Set' : 'Not set');

// Test Firebase service account
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('- FIREBASE_SERVICE_ACCOUNT: Set (from env)');
  } else if (fs.existsSync('./firebase-service-account.json')) {
    const serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'));
    console.log('- FIREBASE_SERVICE_ACCOUNT: Set (from file)');
  } else {
    console.log('- FIREBASE_SERVICE_ACCOUNT: Not set');
  }
} catch (error) {
  console.log('- FIREBASE_SERVICE_ACCOUNT: Error loading');
}

console.log('\nConfiguration test completed!');