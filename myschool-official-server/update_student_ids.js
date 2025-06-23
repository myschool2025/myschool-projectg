import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import admin from 'firebase-admin';
import 'dotenv/config';

// Validate required environment variables
if (
  !process.env.FIREBASE_SERVICE_ACCOUNT ||
  !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  !process.env.GOOGLE_PRIVATE_KEY
) {
  console.error("❌ Missing required environment variables in .env");
  process.exit(1);
}

// Parse Firebase service account credentials
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} catch (error) {
  console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT:", error);
  process.exit(1);
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// Set up Google Spreadsheet auth
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Load the sheet
const doc = new GoogleSpreadsheet(
  '1VEhRX6LRlYKLAJsKGUNz56xr6SxMAZUpt5tDmtpMSF8',
  serviceAccountAuth
);

async function initializeStudentSheet() {
  console.log("📄 Loading Google Sheet...");
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[1]; // index 1 = second sheet

  if (!sheet) {
    throw new Error("❌ Students sheet not found at index 1");
  }

  console.log(`✅ Sheet loaded: "${sheet.title}"`);
  await sheet.setHeaderRow([
    'ID',
    'Name',
    'Class',
    'Number',
    'Description',
    'English Name',
    'Mother Name',
    'Father Name',
    'Photo URL'
  ]);
  return sheet;
}

async function updateStudentIds() {
  try {
    console.log("🚀 Starting student ID update process...");
    const sheet = await initializeStudentSheet();
    const rows = await sheet.getRows();

    if (!rows.length) {
      console.log("⚠️ No rows found in the student sheet.");
      return;
    }

    let lastId = 2500000; // Start from 2500001
    const idRef = db.collection('metadata').doc('studentIdCounter');
    const idDoc = await idRef.get();

    if (idDoc.exists) {
      lastId = idDoc.data().lastId;
    }

    let updatedCount = 0;

    for (const row of rows) {
      const oldId = row.get('ID');

      // Skip rows that already have valid IDs
      if (oldId && oldId.toString().startsWith('25')) continue;

      lastId += 1;
      const newId = lastId.toString();
      row.set('ID', newId);
      await row.save();

      console.log(`✔️ Updated student ID for ${row.get('Name') || 'Unnamed'}: ${newId}`);
      updatedCount++;
    }

    // Update the ID counter in Firestore
    await idRef.set({ lastId });
    console.log(`✅ Completed: ${updatedCount} students updated. Last ID: ${lastId}`);
  } catch (error) {
    console.error("❌ Error during student ID update:", error);
  }
}

// Start the script
console.log("🟢 Script starting...");

updateStudentIds()
  .then(() => {
    console.log("🏁 Script finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  });
