import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import admin from 'firebase-admin';
import fs from 'fs';



// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const serviceAccountFile = fs.readFileSync('./firebase-service-account.json', 'utf8');
    serviceAccount = JSON.parse(serviceAccountFile);
  }
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\n/g, '\n');
  }
} catch (error) {
  logger.error('Error loading Firebase service account:', error);
  throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT configuration');
}
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:8080', 'https://myschool-offical.netlify.app'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json());
app.use(helmet());
app.use(compression());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Health check endpoint
app.get('/health', (req, res) => res.send('OK'));


// Root Endpoint
app.get('/', (_, res) => {
  res.send('MySchool-Official Node.js Server is Running!');
});





// Google Sheets Authentication
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet('1VEhRX6LRlYKLAJsKGUNz56xr6SxMAZUpt5tDmtpMSF8', serviceAccountAuth);

// Initialize Google Sheets API
async function initializeDoc() {
  try {
    await doc.loadInfo();
    console.log('Google Spreadsheet initialized successfully');
  } catch (error) {
    console.error('Error initializing Google Spreadsheet:', error);
    throw error;
  }
}

// Sheet Initialization Functions
async function initializeTransactionSheet() {
  await initializeDoc();
  const sheet = doc.sheetsByIndex[0]; // Transactions sheet
  if (!sheet) {
    throw new Error('Transactions sheet not found at index 0');
  }
  await sheet.setHeaderRow(['ID', 'Date', 'Description', 'Amount', 'Type', 'Category']);
  return sheet;
}

async function initializeStudentSheet() {
  await initializeDoc();
  const sheet = doc.sheetsByIndex[1]; // Students sheet
  if (!sheet) {
    throw new Error('Students sheet not found at index 1');
  }
  await sheet.setHeaderRow(['ID', 'Name', 'Class', 'Number', 'Description', 'English Name', 'Mother Name', 'Father Name', 'Photo URL', 'Academic Year', 'Section', 'Shift']);
  return sheet;
}

async function initializeMarketingLeadsSheet() {
  await initializeDoc();
  const sheet = doc.sheetsByIndex[2]; // Marketing Leads sheet (index 2)
  if (!sheet) {
    throw new Error('Marketing Leads sheet not found at index 2');
  }
  const headerValues = [
    'ID',
    'Name',
    'Class',
    'Number',
    'Description',
    'English Name',
    'Mother Name',
    'Father Name',
    'Photo URL',
    'Academic Year',
    'Section',
    'Shift',
    'Status',
  ];
  await sheet.setHeaderRow(headerValues);
  console.log('Set Marketing Leads sheet headers:', headerValues);
  return sheet;
}

async function initializeFeeSettingsSheet() {
  await initializeDoc();
  const sheet = doc.sheetsByIndex[3]; // FeeSettings sheet (index 3)
  if (!sheet) {
    throw new Error('FeeSettings sheet not found at index 3');
  }
  const headerValues = [
    'Fee ID',
    'Fee Type',
    'Classes',
    'Description',
    'Amount',
    'Active From',
    'Active To',
    'Can Override',
  ];
  await sheet.setHeaderRow(headerValues);
  console.log('Set FeeSettings sheet headers:', headerValues);
  return sheet;
}

async function initializeCustomStudentFeesSheet() {
  await initializeDoc();
  const sheet = doc.sheetsByIndex[4]; // CustomStudentFees sheet (index 4)
  if (!sheet) {
    throw new Error('CustomStudentFees sheet not found at index 4');
  }
  const headerValues = [
    'Student ID',
    'Fee ID',
    'New Amount',
    'Effective From',
    'Active',
    'Reason',
  ];
  await sheet.setHeaderRow(headerValues);
  console.log('Set CustomStudentFees sheet headers:', headerValues);
  return sheet;
}

async function initializeFeeCollectionsSheet() {
  await initializeDoc();
  const sheet = doc.sheetsByIndex[5]; // FeeCollections sheet (index 5)
  if (!sheet) {
    throw new Error('FeeCollections sheet not found at index 5');
  }
  const headerValues = [
    'Collection ID',
    'Date',
    'Student ID',
    'Fee ID',
    'Month',
    'Year',
    'Quantity',
    'Amount Paid',
    'Payment Method',
    'Description',
  ];
  await sheet.setHeaderRow(headerValues);
  console.log('Set FeeCollections sheet headers:', headerValues);
  return sheet;
}

// Initialize Results Sheet
async function initializeResultsSheet() {
  await initializeDoc();
  const sheet = doc.sheetsByIndex[6]; // index 6 = 7th sheet (adjust as needed)
  if (!sheet) {
    throw new Error('Results sheet not found at index 6');
  }
  await sheet.setHeaderRow([
    'ID',
    'Student ID',
    'Student Name',
    'Class',
    'Exam',
    'Subjects', // JSON string
    'Total',
    'Rank'
  ]);
  return sheet;
}

// Function to generate the next student ID
async function generateStudentId() {
  const idRef = db.collection('metadata').doc('studentIdCounter');
  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(idRef);
    let lastId = 2500000; // Starting ID: 2500001
    if (doc.exists) {
      lastId = doc.data().lastId;
    }
    const newId = lastId + 1;
    transaction.set(idRef, { lastId: newId });
    return newId.toString(); // e.g., "2500001"
  });
}

// Function to generate the next fee ID
async function generateFeeId() {
  const idRef = db.collection('metadata').doc('feeIdCounter');
  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(idRef);
    let lastId = 0; // Starting ID: F001
    if (doc.exists) {
      lastId = doc.data().lastId;
    }
    const newId = lastId + 1;
    transaction.set(idRef, { lastId: newId });
    return `F${newId.toString().padStart(3, '0')}`; // e.g., "F001"
  });
}

// Function to generate the next collection ID
async function generateCollectionId() {
  const idRef = db.collection('metadata').doc('collectionIdCounter');
  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(idRef);
    let lastId = 0; // Starting ID: C00001
    if (doc.exists) {
      lastId = doc.data().lastId;
    }
    const newId = lastId + 1;
    transaction.set(idRef, { lastId: newId });
    return `C${newId.toString().padStart(5, '0')}`; // e.g., "C00001"
  });
}

// Helper to get subjects for a class/exam
async function getSubjectsForClassExam(className, examName) {
  const examSheet = await initializeExamConfigsSheet();
  const rows = await examSheet.getRows();
  const config = rows.find(row =>
    row.get('Class') === className && row.get('Exam') === examName
  );
  if (!config) return [];
  return (config.get('Subjects') || '').split(',').map(s => s.trim()).filter(Boolean);
}

// =========================
// Auth & User Management
// =========================
// ... (user endpoints: /users, authentication, etc.)

// =========================
// Students
// =========================
// ... (student endpoints: /students, /students/export-csv, etc.)

// =========================
// Marketing Leads
// =========================
// ... (marketing endpoints: /marketing-leads, /marketing-leads-analysis, /marketing-leads-report, etc.)

// =========================
// Fee Settings & Collections
// =========================
// ... (fee endpoints: /fee-settings, /custom-student-fees, /fee-collections, /fee-analysis, /fee-reports, etc.)

// =========================
// Results & Exams
// =========================
// ... (results/exam endpoints: /results, /exam-configs, etc.)

// =========================
// Transactions
// =========================
// ... (transaction endpoints: /transactions, etc.)

// =========================
// Utility & Miscellaneous
// =========================
// ... (utility endpoints, root, SMS, etc.)

// Root Endpoint
app.get('/', (_, res) => {
  res.send('MySchool-Official Node.js Server is Running!');
});

// SMS Service Endpoints
app.post('/sendSMS', async (req, res) => {
  const { number, message } = req.body;
  const apiKey = process.env.BULKSMSBD_API_KEY;
  const senderId = process.env.BULKSMSBD_SENDER_ID;
  const smsApiUrl = `http://bulksmsbd.net/api/smsapi`;

  try {
    const response = await axios.post(smsApiUrl, {
      api_key: apiKey,
      senderid: senderId,
      number,
      message,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send SMS',
      details: error.response?.data || error.message,
    });
  }
});

app.get('/getBalance', async (_, res) => {
  const apiKey = process.env.BULKSMSBD_API_KEY || 'W7QHhND7D6gKbyld31Pq';
  const url = `http://bulksmsbd.net/api/getBalanceApi?api_key=${apiKey}`;
  try {
    const response = await axios.get(url);
    console.log('Balance API response:', response.data);
    if (response.data && response.data.balance !== undefined) {
      res.json({ balance: response.data.balance });
    } else {
      console.error('Invalid response from SMS provider:', response.data);
      res.status(502).json({ error: 'Invalid response from SMS provider', details: response.data });
    }
  } catch (error) {
    console.error('Error fetching balance:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    res.status(500).json({
      error: 'Failed to fetch balance',
      details: error.response?.data || error.message,
    });
  }
});

// Admin Overview Endpoint
app.get('/admin-overview', async (req, res) => {
  try {
    // Fetch Transactions
    const transactionSheet = await initializeTransactionSheet();
    const transactionRows = await transactionSheet.getRows();
    const transactions = transactionRows.map(row => ({
      id: row.get('ID') || '',
      date: row.get('Date') || '',
      description: row.get('Description') || '',
      amount: parseFloat(row.get('Amount') || 0),
      type: row.get('Type') || '',
      category: row.get('Category') || '',
    }));

    // Fetch Students
    const studentSheet = await initializeStudentSheet();
    const studentRows = await studentSheet.getRows();
    const students = studentRows.map(row => ({
      id: row.get('ID') || '',
      name: row.get('Name') || '',
      class: row.get('Class') || '',
      number: row.get('Number') || '',
      description: row.get('Description') || '',
      englishName: row.get('English Name') || '',
      motherName: row.get('Mother Name') || '',
      fatherName: row.get('Father Name') || '',
      photoUrl: row.get('Photo URL') || '',
      academicYear: row.get('Academic Year') || '',
      section: row.get('Section') || '',
      shift: row.get('Shift') || '',
    }));

    // Calculate Transaction Stats
    const totalIncome = transactions
      .filter(t => t.type.toLowerCase() === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type.toLowerCase() === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const categoryDistribution = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    // Calculate Student Stats
    const classDistribution = students.reduce((acc, s) => {
      acc[s.class] = (acc[s.class] || 0) + 1;
      return acc;
    }, {});
    const missingFields = {
      name: students.filter(s => !s.name).length,
      description: students.filter(s => !s.description).length,
      class: students.filter(s => !s.class).length,
      number: students.filter(s => !s.number).length,
      englishName: students.filter(s => !s.englishName).length,
      motherName: students.filter(s => !s.motherName).length,
      fatherName: students.filter(s => !s.fatherName).length,
      photoUrl: students.filter(s => !s.photoUrl).length,
      academicYear: students.filter(s => !s.academicYear).length,
      section: students.filter(s => !s.section).length,
      shift: students.filter(s => !s.shift).length,
    };
    const incompleteProfiles = students.filter(s =>
      !s.name || !s.class || !s.number || !s.englishName || !s.motherName || !s.fatherName || !s.photoUrl || !s.academicYear || !s.section || !s.shift
    ).length;
    const parentNames = new Set([...students.map(s => s.motherName), ...students.map(s => s.fatherName)].filter(Boolean));

    // Last Updated
    const latestUpdate = [
      ...transactions.map(t => new Date(t.date)),
      ...students.map(s => new Date(s.id.split('-')[1] || Date.now())),
    ].reduce((latest, date) => (date > latest ? date : latest), new Date(0));

    res.json({
      message: 'Admin overview retrieved successfully',
      overview: {
        transactions: {
          totalIncome,
          totalExpenses,
          netBalance: totalIncome - totalExpenses,
          categoryDistribution,
          totalTransactions: transactions.length,
        },
        students: {
          totalStudents: students.length,
          classDistribution,
          missingFields,
          incompleteProfiles,
          uniqueParents: parentNames.size,
        },
        lastUpdated: latestUpdate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ error: 'Failed to fetch admin overview', details: error.message });
  }
});

// Transaction Endpoints
app.post('/transactions', async (req, res) => {
  try {
    const { date, description, amount, type, category } = req.body;

    if (!date || !description || !amount || !type || !category) {
      return res.status(400).json({ error: 'All fields (date, description, amount, type, category) are required' });
    }

    const sheet = await initializeTransactionSheet();
    const id = await generateStudentId();

    await sheet.addRow({
      ID: id,
      Date: date,
      Description: description,
      Amount: parseFloat(amount),
      Type: type,
      Category: category,
    });

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction: { id, date, description, amount: parseFloat(amount), type, category },
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: 'Failed to add transaction', details: error.message });
  }
});

app.get('/transactions', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const sheet = await initializeTransactionSheet();
    const rows = await sheet.getRows();

    let transactions = rows.map(row => ({
      id: row.get('ID') || '',
      date: row.get('Date') || '',
      description: row.get('Description') || '',
      amount: parseFloat(row.get('Amount') || 0),
      type: row.get('Type') || '',
      category: row.get('Category') || '',
    }));

    if (startDate || endDate) {
      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date || '');
        if (startDate && endDate) {
          return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
        } else if (startDate) {
          return transactionDate >= new Date(startDate);
        } else if (endDate) {
          return transactionDate <= new Date(endDate);
        }
        return true;
      });
    }

    res.json({
      message: 'Transactions retrieved successfully',
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
});

app.put('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, amount, type, category } = req.body;

    if (!date || !description || !amount || !type || !category) {
      return res.status(400).json({ error: 'All fields (date, description, amount, type, category) are required' });
    }

    const sheet = await initializeTransactionSheet();
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('ID') === id);
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    row.set('Date', date);
    row.set('Description', description);
    row.set('Amount', parseFloat(amount));
    row.set('Type', type);
    row.set('Category', category);
    await row.save();

    res.json({
      message: 'Transaction updated successfully',
      transaction: { id, date, description, amount: parseFloat(amount), type, category },
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction', details: error.message });
  }
});

app.delete('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sheet = await initializeTransactionSheet();
    const rows = await sheet.getRows();

    const rowIndex = rows.findIndex(r => r.get('ID') === id);
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await rows[rowIndex].delete();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction', details: error.message });
  }
}); 

// Student Endpoints
app.get('/students', async (req, res) => {
  try {
    const { page = 0, limit = 30, class: classFilter } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const sheet = await initializeStudentSheet();
    const rows = await sheet.getRows();

    let students = rows.map(row => ({
      id: row.get('ID') || '',
      name: row.get('Name') || '',
      class: row.get('Class') || '',
      number: row.get('Number') || '',
      description: row.get('Description') || '',
      englishName: row.get('English Name') || '',
      motherName: row.get('Mother Name') || '',
      fatherName: row.get('Father Name') || '',
      photoUrl: row.get('Photo URL') || '',
      academicYear: row.get('Academic Year') || '',
      section: row.get('Section') || '',
      shift: row.get('Shift') || '',
    }));

    if (classFilter) {
      students = students.filter(student => student.class === classFilter);
    }

    const total = students.length;
    const start = pageNum * limitNum;
    const paginatedStudents = students.slice(start, start + limitNum);

    res.json({
      message: 'Students retrieved successfully',
      students: paginatedStudents,
      total,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students', details: error.message });
  }
});

app.post('/students', async (req, res) => {
  try {
    const { 
      name, 
      class: studentClass, 
      number, 
      description, 
      englishName, 
      motherName, 
      fatherName, 
      photoUrl,
      academicYear,
      section,
      shift
    } = req.body;

    if (!name || !studentClass) {
      return res.status(400).json({ error: 'Name and Class are required' });
    }

    const sheet = await initializeStudentSheet();
    const id = uuidv4();

    await sheet.addRow({
      ID: id,
      Name: name,
      Class: studentClass,
      Number: number || '',
      Description: description || '',
      'English Name': englishName || '',
      'Mother Name': motherName || '',
      'Father Name': fatherName || '',
      'Photo URL': photoUrl || '',
      'Academic Year': academicYear || '',
      'Section': section || '',
      'Shift': shift || '',
    });

    res.status(201).json({
      message: 'Student added successfully',
      student: { 
        id, 
        name, 
        class: studentClass, 
        number, 
        description, 
        englishName, 
        motherName, 
        fatherName, 
        photoUrl,
        academicYear,
        section,
        shift
      },
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Failed to add student', details: error.message });
  }
});

app.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      class: studentClass, 
      number, 
      description, 
      englishName, 
      motherName, 
      fatherName, 
      photoUrl,
      academicYear,
      section,
      shift
    } = req.body;

    if (!name || !studentClass) {
      return res.status(400).json({ error: 'Name and Class are required' });
    }

    const sheet = await initializeStudentSheet();
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('ID') === id);
    if (!row) {
      return res.status(404).json({ error: 'Student not found' });
    }

    row.set('Name', name);
    row.set('Class', studentClass);
    row.set('Number', number || '');
    row.set('Description', description || '');
    row.set('English Name', englishName || '');
    row.set('Mother Name', motherName || '');
    row.set('Father Name', fatherName || '');
    row.set('Photo URL', photoUrl || '');
    row.set('Academic Year', academicYear || '');
    row.set('Section', section || '');
    row.set('Shift', shift || '');
    await row.save();

    res.json({
      message: 'Student updated successfully',
      student: { 
        id, 
        name, 
        class: studentClass, 
        number, 
        description, 
        englishName, 
        motherName, 
        fatherName, 
        photoUrl,
        academicYear,
        section,
        shift
      },
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student', details: error.message });
  }
});

app.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const studentSheet = await initializeStudentSheet();
    const marketingSheet = await initializeMarketingLeadsSheet();
    const studentRows = await studentSheet.getRows();

    const rowIndex = studentRows.findIndex(r => r.get('ID') === id);
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentRow = studentRows[rowIndex];
    const studentData = {
      ID: uuidv4(),
      Name: studentRow.get('Name') || '',
      Class: studentRow.get('Class') || '',
      Number: studentRow.get('Number') || '',
      Description: studentRow.get('Description') || '',
      'English Name': studentRow.get('English Name') || '',
      'Mother Name': studentRow.get('Mother Name') || '',
      'Father Name': studentRow.get('Father Name') || '',
      'Photo URL': studentRow.get('Photo URL') || '',
      'Academic Year': studentRow.get('Academic Year') || '',
      'Section': studentRow.get('Section') || '',
      'Shift': studentRow.get('Shift') || '',
      Status: 'Canceled',
    };

    // Add to marketing leads sheet with status
    await marketingSheet.addRow(studentData);

    // Delete from students sheet
    await studentRows[rowIndex].delete();

    res.json({
      message: 'Student deleted and data stored in marketing leads sheet',
      deletedStudent: studentData,
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      error: 'Failed to delete student and store data',
      details: error.message,
    });
  }
});

app.get('/students/export-csv', async (req, res) => {
  try {
    const { class: classFilter } = req.query;

    const sheet = await initializeStudentSheet();
    const rows = await sheet.getRows();

    let students = rows.map(row => ({
      id: row.get('ID') || '',
      name: row.get('Name') || '',
      class: row.get('Class') || '',
      number: row.get('Number') || '',
      description: row.get('Description') || '',
      englishName: row.get('English Name') || '',
      motherName: row.get('Mother Name') || '',
      fatherName: row.get('Father Name') || '',
      photoUrl: row.get('Photo URL') || '',
      academicYear: row.get('Academic Year') || '',
      section: row.get('Section') || '',
      shift: row.get('Shift') || '',
    }));

    if (classFilter) {
      students = students.filter(student => student.class === classFilter);
    }

    const csvRows = [
      ['ID', 'Name', 'Class', 'Number', 'Description', 'English Name', 'Mother Name', 'Father Name', 'Photo URL', 'Academic Year', 'Section', 'Shift'],
      ...students.map(student => [
        student.id,
        student.name,
        student.class,
        student.number,
        student.description,
        student.englishName,
        student.motherName,
        student.fatherName,
        student.photoUrl,
        student.academicYear,
        student.section,
        student.shift,
      ]),
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment(`students${classFilter ? `_${classFilter}` : ''}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting students to CSV:', error);
    res.status(500).json({ error: 'Failed to export students to CSV', details: error.message });
  }
});


// Marketing Leads Analysis Endpoint
app.get('/marketing-leads-analysis', async (req, res) => {
  try {
    const { status, search } = req.query;
    const marketingSheet = await initializeMarketingLeadsSheet();
    const studentSheet = await initializeStudentSheet();
    const marketingRows = await marketingSheet.getRows();
    const studentRows = await studentSheet.getRows();

    // Create a map of student data by phone number for quick lookup
    const studentMap = new Map(
      studentRows.map(row => [
        row.get('Number'),
        {
          id: row.get('ID') || '',
          name: row.get('Name') || '',
          class: row.get('Class') || '',
          number: row.get('Number') || '',
          description: row.get('Description') || '',
          englishName: row.get('English Name') || '',
          motherName: row.get('Mother Name') || '',
          fatherName: row.get('Father Name') || '',
          photoUrl: row.get('Photo URL') || '',
          academicYear: row.get('Academic Year') || '',
          section: row.get('Section') || '',
          shift: row.get('Shift') || '',
        }
      ])
    );

    // Fetch and process marketing leads
    let leads = marketingRows.map(row => {
      const number = row.get('Number');
      const currentStatus = row.get('Status') || 'Not Admitted';
      const studentData = studentMap.get(number);

      return {
        id: row.get('ID') || '',
        name: row.get('Name') || '',
        class: row.get('Class') || '',
        number: number || '',
        description: row.get('Description') || '',
        englishName: row.get('English Name') || '',
        motherName: row.get('Mother Name') || '',
        fatherName: row.get('Father Name') || '',
        photoUrl: row.get('Photo URL') || '',
        academicYear: row.get('Academic Year') || '',
        section: row.get('Section') || '',
        shift: row.get('Shift') || '',
        status: currentStatus,
        studentData: currentStatus === 'Admitted' ? studentData : null
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toString().toLowerCase();
      leads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchLower) ||
        lead.number.toLowerCase().includes(searchLower) ||
        lead.class.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status) {
      leads = leads.filter(lead => lead.status === status);
    }

    // Calculate statistics
    const totalLeads = leads.length;
    const admitted = leads.filter(lead => lead.status === 'Admitted').length;
    const notAdmitted = leads.filter(lead => lead.status === 'Not Admitted').length;
    const canceled = leads.filter(lead => lead.status === 'Canceled').length;

    // Conversion rate
    const admittedPercentage = totalLeads > 0 ? ((admitted / totalLeads) * 100).toFixed(2) : '0.00';
    const notAdmittedPercentage = totalLeads > 0 ? ((notAdmitted / totalLeads) * 100).toFixed(2) : '0.00';
    const canceledPercentage = totalLeads > 0 ? ((canceled / totalLeads) * 100).toFixed(2) : '0.00';

    // Number analysis
    const leadNumbers = leads.map(lead => lead.number).filter(Boolean);
    const uniqueLeadNumbers = new Set(leadNumbers).size;
    const duplicateLeadNumbers = leadNumbers.length - uniqueLeadNumbers;
    const matchingNumbers = leadNumbers.filter(num => studentMap.has(num)).length;

    // Class distribution with status breakdown
    const classDistribution = leads.reduce((acc, lead) => {
      const className = lead.class || 'Unknown';
      if (!acc[className]) {
        acc[className] = {
          total: 0,
          admitted: 0,
          notAdmitted: 0,
          canceled: 0
        };
      }
      acc[className].total++;
      acc[className][lead.status.toLowerCase()]++;
      return acc;
    }, {});

    // Data quality analysis
    const dataQuality = {
      completeProfiles: leads.filter(lead =>
        lead.name && lead.class && lead.number &&
        lead.englishName && lead.motherName &&
        lead.fatherName && lead.photoUrl
      ).length,
      incompleteProfiles: leads.filter(lead =>
        !lead.name || !lead.class || !lead.number ||
        !lead.englishName || !lead.motherName ||
        !lead.fatherName || !lead.photoUrl
      ).length,
      missingFields: {
        name: leads.filter(lead => !lead.name).length,
        class: leads.filter(lead => !lead.class).length,
        number: leads.filter(lead => !lead.number).length,
        englishName: leads.filter(lead => !lead.englishName).length,
        motherName: leads.filter(lead => !lead.motherName).length,
        fatherName: leads.filter(lead => !lead.fatherName).length,
        photoUrl: leads.filter(lead => !lead.photoUrl).length,
      }
    };

    res.json({
      message: 'Marketing leads analysis retrieved successfully',
      stats: {
        totalLeads,
        statusBreakdown: {
          admitted,
          notAdmitted,
          canceled,
          admittedPercentage,
          notAdmittedPercentage,
          canceledPercentage
        },
        numberAnalysis: {
          totalNumbers: leadNumbers.length,
          uniqueNumbers: uniqueLeadNumbers,
          duplicateNumbers: duplicateLeadNumbers,
          matchingWithStudents: matchingNumbers
        },
        classDistribution,
        dataQuality
      },
      leads
    });
  } catch (error) {
    console.error('Error fetching marketing leads analysis:', error);
    res.status(500).json({
      error: 'Failed to fetch marketing leads analysis',
      details: error.message
    });
  }
});

 // Marketing Leads Report Endpoint
 app.get('/marketing-leads-report', async (req, res) => {
  try {
    const { status, search } = req.query;
    const marketingSheet = await initializeMarketingLeadsSheet();
    const studentSheet = await initializeStudentSheet();
    const marketingRows = await marketingSheet.getRows();
    const studentRows = await studentSheet.getRows();

    // Create a map of student data by phone number for quick lookup
    const studentMap = new Map(
      studentRows.map(row => [
        row.get('Number'),
        {
          id: row.get('ID') || '',
          name: row.get('Name') || '',
          class: row.get('Class') || '',
          number: row.get('Number') || '',
          description: row.get('Description') || '',
          englishName: row.get('English Name') || '',
          motherName: row.get('Mother Name') || '',
          fatherName: row.get('Father Name') || '',
          photoUrl: row.get('Photo URL') || '',
          academicYear: row.get('Academic Year') || '',
          section: row.get('Section') || '',
          shift: row.get('Shift') || '',
        }
      ])
    );

    // Fetch and process marketing leads
    let leads = marketingRows.map(row => {
      const number = row.get('Number');
      const currentStatus = row.get('Status') || 'Not Admitted';
      const studentData = studentMap.get(number);

      return {
        id: row.get('ID') || '',
        name: row.get('Name') || '',
        class: row.get('Class') || '',
        number: number || '',
        description: row.get('Description') || '',
        englishName: row.get('English Name') || '',
        motherName: row.get('Mother Name') || '',
        fatherName: row.get('Father Name') || '',
        photoUrl: row.get('Photo URL') || '',
        academicYear: row.get('Academic Year') || '',
        section: row.get('Section') || '',
        shift: row.get('Shift') || '',
        status: currentStatus,
        studentData: currentStatus === 'Admitted' ? studentData : null
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toString().toLowerCase();
      leads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchLower) ||
        lead.number.toLowerCase().includes(searchLower) ||
        lead.class.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status) {
      leads = leads.filter(lead => lead.status === status);
    }

    res.json({
      message: 'Marketing leads report data retrieved successfully',
      leads,
      total: leads.length,
    });
  } catch (error) {
    console.error('Error fetching marketing leads report data:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to fetch marketing leads report data',
      details: error.message,
    });
  }
});

app.post('/marketing-leads', async (req, res) => {
  try {
    const {
      name,
      class: studentClass,
      number,
      description,
      englishName,
      motherName,
      fatherName,
      photoUrl,
      academicYear,
      section,
      shift,
      status = 'Not Admitted',
    } = req.body;

    if (!name || !number) {
      return res.status(400).json({ error: 'Name and Number are required' });
    }

    const sheet = await initializeMarketingLeadsSheet();
    const id = uuidv4();

    await sheet.addRow({
      ID: id,
      Name: name,
      Class: studentClass || '',
      Number: number,
      Description: description || '',
      'English Name': englishName || '',
      'Mother Name': motherName || '',
      'Father Name': fatherName || '',
      'Photo URL': photoUrl || '',
      'Academic Year': academicYear || '',
      Section: section || '',
      Shift: shift || '',
      Status: status,
    });

    res.status(201).json({
      message: 'Marketing lead added successfully',
      lead: {
        id,
        name,
        class: studentClass,
        number,
        description,
        englishName,
        motherName,
        fatherName,
        photoUrl,
        academicYear,
        section,
        shift,
        status,
      },
    });
  } catch (error) {
    console.error('Error adding marketing lead:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to add marketing lead',
      details: error.message,
    });
  }
});

app.put('/marketing-leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      class: studentClass,
      number,
      description,
      englishName,
      motherName,
      fatherName,
      photoUrl,
      academicYear,
      section,
      shift,
      status,
    } = req.body;

    if (!name || !number) {
      return res.status(400).json({ error: 'Name and Number are required' });
    }

    const sheet = await initializeMarketingLeadsSheet();
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (!row) {
      return res.status(404).json({ error: 'Marketing lead not found' });
    }

    row.set('Name', name);
    row.set('Class', studentClass || '');
    row.set('Number', number);
    row.set('Description', description || '');
    row.set('English Name', englishName || '');
    row.set('Mother Name', motherName || '');
    row.set('Father Name', fatherName || '');
    row.set('Photo URL', photoUrl || '');
    row.set('Academic Year', academicYear || '');
    row.set('Section', section || '');
    row.set('Shift', shift || '');
    row.set('Status', status || 'Not Admitted');
    await row.save();

    res.json({
      message: 'Marketing lead updated successfully',
      lead: {
        id,
        name,
        class: studentClass,
        number,
        description,
        englishName,
        motherName,
        fatherName,
        photoUrl,
        academicYear,
        section,
        shift,
        status,
      },
    });
  } catch (error) {
    console.error('Error updating marketing lead:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to update marketing lead',
      details: error.message,
    });
  }
});

app.delete('/marketing-leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sheet = await initializeMarketingLeadsSheet();
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(r => r.get('ID') === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Marketing lead not found' });
    }

    await rows[rowIndex].delete();
    res.json({ message: 'Marketing lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting marketing lead:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to delete marketing lead',
      details: error.message,
    });
  }
});

// Add this new endpoint for bulk status updates
app.post('/marketing-leads/bulk-update-status', async (req, res) => {
  try {
    // Get all students and their phone numbers
    const studentSheet = await initializeStudentSheet();
    const studentRows = await studentSheet.getRows();
    const studentNumbers = new Set(
      studentRows
        .map(row => row.get('Number'))
        .filter(Boolean)
    );

    // Get all marketing leads
    const marketingSheet = await initializeMarketingLeadsSheet();
    const marketingRows = await marketingSheet.getRows();
    let admittedCount = 0;
    let notAdmittedCount = 0;
    let skippedCount = 0;

    // Update status for each lead
    for (const row of marketingRows) {
      const phoneNumber = row.get('Number');
      const currentStatus = row.get('Status');

      // Skip if status is 'Canceled'
      if (currentStatus === 'Canceled') {
        skippedCount++;
        continue;
      }

      if (phoneNumber) {
        const newStatus = studentNumbers.has(phoneNumber) ? 'Admitted' : 'Not Admitted';
        if (currentStatus !== newStatus) {
          row.set('Status', newStatus);
          await row.save();
          if (newStatus === 'Admitted') {
            admittedCount++;
          } else {
            notAdmittedCount++;
          }
        }
      }
    }

    res.json({
      message: 'Bulk status update completed successfully',
      stats: {
        totalLeads: marketingRows.length,
        leadsUpdatedToAdmitted: admittedCount,
        leadsUpdatedToNotAdmitted: notAdmittedCount,
        leadsSkipped: skippedCount,
        totalStudents: studentNumbers.size
      }
    });
  } catch (error) {
    console.error('Error in bulk status update:', error);
    res.status(500).json({
      error: 'Failed to perform bulk status update',
      details: error.message
    });
  }
});

// Fee Settings Endpoints
app.get('/fee-settings', async (req, res) => {
  try {
    const { class: classFilter, feeType, active } = req.query;
    const sheet = await initializeFeeSettingsSheet();
    const rows = await sheet.getRows();

    let feeSettings = rows.map(row => ({
      feeId: row.get('Fee ID') || '',
      feeType: row.get('Fee Type') || '',
      classes: (row.get('Classes') || '').split(',').map(s => s.trim()).filter(Boolean),
      description: row.get('Description') || '',
      amount: parseFloat(row.get('Amount') || 0),
      activeFrom: row.get('Active From') || '',
      activeTo: row.get('Active To') || '',
      canOverride: row.get('Can Override') === 'Y',
    }));

    // Apply filters
    if (classFilter) {
      feeSettings = feeSettings.filter(fee => fee.classes.includes(classFilter));
    }
    if (feeType) {
      feeSettings = feeSettings.filter(fee => fee.feeType === feeType);
    }
    if (active === 'true') {
      const now = new Date();
      feeSettings = feeSettings.filter(fee => {
        const activeFrom = new Date(fee.activeFrom);
        const activeTo = new Date(fee.activeTo);
        return now >= activeFrom && now <= activeTo;
      });
    }

    res.json({
      message: 'Fee settings retrieved successfully',
      feeSettings,
      total: feeSettings.length,
    });
  } catch (error) {
    console.error('Error fetching fee settings:', error);
    res.status(500).json({ error: 'Failed to fetch fee settings', details: error.message });
  }
});

app.post('/fee-settings', async (req, res) => {
  try {
    const { feeType, classes, description, amount, activeFrom, activeTo, canOverride } = req.body;

    if (!feeType || !description || !amount || !activeFrom || !activeTo || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ error: 'All fields and at least one class are required' });
    }

    const sheet = await initializeFeeSettingsSheet();
    const feeId = await generateFeeId();

    await sheet.addRow({
      'Fee ID': feeId,
      'Fee Type': feeType,
      'Classes': classes.join(','),
      'Description': description,
      'Amount': parseFloat(amount),
      'Active From': activeFrom,
      'Active To': activeTo,
      'Can Override': canOverride ? 'Y' : 'N',
    });

    res.status(201).json({
      message: 'Fee setting added successfully',
      feeSetting: {
        feeId,
        feeType,
        classes,
        description,
        amount: parseFloat(amount),
        activeFrom,
        activeTo,
        canOverride: canOverride || false,
      },
    });
  } catch (error) {
    console.error('Error adding fee setting:', error);
    res.status(500).json({ error: 'Failed to add fee setting', details: error.message });
  }
});

app.put('/fee-settings/:feeId', async (req, res) => {
  try {
    const { feeId } = req.params;
    const { feeType, classes, description, amount, activeFrom, activeTo, canOverride } = req.body;

    if (!feeType || !description || !amount || !activeFrom || !activeTo || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ error: 'All fields and at least one class are required' });
    }

    const sheet = await initializeFeeSettingsSheet();
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('Fee ID') === feeId);
    if (!row) {
      return res.status(404).json({ error: 'Fee setting not found' });
    }

    row.set('Fee Type', feeType);
    row.set('Classes', classes.join(','));
    row.set('Description', description);
    row.set('Amount', parseFloat(amount));
    row.set('Active From', activeFrom);
    row.set('Active To', activeTo);
    row.set('Can Override', canOverride ? 'Y' : 'N');
    await row.save();

    res.json({
      message: 'Fee setting updated successfully',
      feeSetting: {
        feeId,
        feeType,
        classes,
        description,
        amount: parseFloat(amount),
        activeFrom,
        activeTo,
        canOverride: canOverride || false,
      },
    });
  } catch (error) {
    console.error('Error updating fee setting:', error);
    res.status(500).json({ error: 'Failed to update fee setting', details: error.message });
  }
});

app.delete('/fee-settings/:feeId', async (req, res) => {
  try {
    const { feeId } = req.params;

    const sheet = await initializeFeeSettingsSheet();
    const rows = await sheet.getRows();

    const rowIndex = rows.findIndex(r => r.get('Fee ID') === feeId);
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Fee setting not found' });
    }

    await rows[rowIndex].delete();
    res.json({ message: 'Fee setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee setting:', error);
    res.status(500).json({ error: 'Failed to delete fee setting', details: error.message });
  }
});

// Custom Student Fees Endpoints
app.get('/custom-student-fees', async (req, res) => {
  try {
    const { studentId, feeId, active } = req.query;
    const sheet = await initializeCustomStudentFeesSheet();
    const rows = await sheet.getRows();

    let customFees = rows.map(row => ({
      studentId: row.get('Student ID') || '',
      feeId: row.get('Fee ID') || '',
      newAmount: parseFloat(row.get('New Amount') || 0),
      effectiveFrom: row.get('Effective From') || '',
      active: row.get('Active') === 'Y',
      reason: row.get('Reason') || '',
    }));

    // Apply filters
    if (studentId) {
      customFees = customFees.filter(fee => fee.studentId === studentId);
    }
    if (feeId) {
      customFees = customFees.filter(fee => fee.feeId === feeId);
    }
    if (active === 'true') {
      customFees = customFees.filter(fee => fee.active);
    }

    res.json({
      message: 'Custom student fees retrieved successfully',
      customFees,
      total: customFees.length,
    });
  } catch (error) {
    console.error('Error fetching custom student fees:', error);
    res.status(500).json({ error: 'Failed to fetch custom student fees', details: error.message });
  }
});

app.post('/custom-student-fees', async (req, res) => {
  try {
    const { studentId, feeId, newAmount, effectiveFrom, active, reason } = req.body;

    if (!studentId || !feeId || !newAmount || !effectiveFrom) {
      return res.status(400).json({ 
        error: 'Student ID, Fee ID, New Amount, and Effective From are required' 
      });
    }

    const sheet = await initializeCustomStudentFeesSheet();

    await sheet.addRow({
      'Student ID': studentId,
      'Fee ID': feeId,
      'New Amount': parseFloat(newAmount),
      'Effective From': effectiveFrom,
      'Active': active ? 'Y' : 'N',
      'Reason': reason || '',
    });

    res.status(201).json({
      message: 'Custom student fee added successfully',
      customFee: {
        studentId,
        feeId,
        newAmount: parseFloat(newAmount),
        effectiveFrom,
        active: active || false,
        reason,
      },
    });
  } catch (error) {
    console.error('Error adding custom student fee:', error);
    res.status(500).json({ error: 'Failed to add custom student fee', details: error.message });
  }
});

app.put('/custom-student-fees/:studentId/:feeId', async (req, res) => {
  try {
    const { studentId, feeId } = req.params;
    const { newAmount, effectiveFrom, active, reason } = req.body;

    if (!newAmount || !effectiveFrom) {
      return res.status(400).json({ 
        error: 'New Amount and Effective From are required' 
      });
    }

    const sheet = await initializeCustomStudentFeesSheet();
    const rows = await sheet.getRows();

    const row = rows.find(r => 
      r.get('Student ID') === studentId && r.get('Fee ID') === feeId
    );
    if (!row) {
      return res.status(404).json({ error: 'Custom student fee not found' });
    }

    row.set('New Amount', parseFloat(newAmount));
    row.set('Effective From', effectiveFrom);
    row.set('Active', active ? 'Y' : 'N');
    row.set('Reason', reason || '');
    await row.save();

    res.json({
      message: 'Custom student fee updated successfully',
      customFee: {
        studentId,
        feeId,
        newAmount: parseFloat(newAmount),
        effectiveFrom,
        active: active || false,
        reason,
      },
    });
  } catch (error) {
    console.error('Error updating custom student fee:', error);
    res.status(500).json({ error: 'Failed to update custom student fee', details: error.message });
  }
});

app.delete('/custom-student-fees/:studentId/:feeId', async (req, res) => {
  try {
    const { studentId, feeId } = req.params;

    const sheet = await initializeCustomStudentFeesSheet();
    const rows = await sheet.getRows();

    const rowIndex = rows.findIndex(r => 
      r.get('Student ID') === studentId && r.get('Fee ID') === feeId
    );
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Custom student fee not found' });
    }

    await rows[rowIndex].delete();
    res.json({ message: 'Custom student fee deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom student fee:', error);
    res.status(500).json({ error: 'Failed to delete custom student fee', details: error.message });
  }
});

// Fee Collections Endpoints
app.get('/fee-collections', async (req, res) => {
  try {
    const { studentId, feeId, month, year, paymentMethod } = req.query;
    const sheet = await initializeFeeCollectionsSheet();
    const rows = await sheet.getRows();

    let collections = rows.map(row => ({
      collectionId: row.get('Collection ID') || '',
      date: row.get('Date') || '',
      studentId: row.get('Student ID') || '',
      feeId: row.get('Fee ID') || '',
      month: row.get('Month') || '',
      year: row.get('Year') || '',
      quantity: parseInt(row.get('Quantity') || 1),
      amountPaid: parseFloat(row.get('Amount Paid') || 0),
      paymentMethod: row.get('Payment Method') || '',
      description: row.get('Description') || '',
    }));

    // Apply filters
    if (studentId) {
      collections = collections.filter(collection => collection.studentId === studentId);
    }
    if (feeId) {
      collections = collections.filter(collection => collection.feeId === feeId);
    }
    if (month) {
      collections = collections.filter(collection => collection.month === month);
    }
    if (year) {
      collections = collections.filter(collection => collection.year === year);
    }
    if (paymentMethod) {
      collections = collections.filter(collection => collection.paymentMethod === paymentMethod);
    }

    res.json({
      message: 'Fee collections retrieved successfully',
      collections,
      total: collections.length,
    });
  } catch (error) {
    console.error('Error fetching fee collections:', error);
    res.status(500).json({ error: 'Failed to fetch fee collections', details: error.message });
  }
});

app.post('/fee-collections', async (req, res) => {
  try {
    const { 
      date, 
      studentId, 
      feeId, 
      month, 
      year, 
      quantity, 
      amountPaid, 
      paymentMethod, 
      description 
    } = req.body;

    if (!date || !studentId || !feeId || !amountPaid || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Date, Student ID, Fee ID, Amount Paid, and Payment Method are required' 
      });
    }

    const sheet = await initializeFeeCollectionsSheet();
    const collectionId = await generateCollectionId();

    await sheet.addRow({
      'Collection ID': collectionId,
      'Date': date,
      'Student ID': studentId,
      'Fee ID': feeId,
      'Month': month || '',
      'Year': year || new Date().getFullYear().toString(),
      'Quantity': parseInt(quantity) || 1,
      'Amount Paid': parseFloat(amountPaid),
      'Payment Method': paymentMethod,
      'Description': description || '',
    });

    res.status(201).json({
      message: 'Fee collection added successfully',
      collection: {
        collectionId,
        date,
        studentId,
        feeId,
        month,
        year: year || new Date().getFullYear().toString(),
        quantity: parseInt(quantity) || 1,
        amountPaid: parseFloat(amountPaid),
        paymentMethod,
        description,
      },
    });
  } catch (error) {
    console.error('Error adding fee collection:', error);
    res.status(500).json({ error: 'Failed to add fee collection', details: error.message });
  }
});

app.put('/fee-collections/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { 
      date, 
      studentId, 
      feeId, 
      month, 
      year, 
      quantity, 
      amountPaid, 
      paymentMethod, 
      description 
    } = req.body;

    if (!date || !studentId || !feeId || !amountPaid || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Date, Student ID, Fee ID, Amount Paid, and Payment Method are required' 
      });
    }

    const sheet = await initializeFeeCollectionsSheet();
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('Collection ID') === collectionId);
    if (!row) {
      return res.status(404).json({ error: 'Fee collection not found' });
    }

    row.set('Date', date);
    row.set('Student ID', studentId);
    row.set('Fee ID', feeId);
    row.set('Month', month || '');
    row.set('Year', year || new Date().getFullYear().toString());
    row.set('Quantity', parseInt(quantity) || 1);
    row.set('Amount Paid', parseFloat(amountPaid));
    row.set('Payment Method', paymentMethod);
    row.set('Description', description || '');
    await row.save();

    res.json({
      message: 'Fee collection updated successfully',
      collection: {
        collectionId,
        date,
        studentId,
        feeId,
        month,
        year: year || new Date().getFullYear().toString(),
        quantity: parseInt(quantity) || 1,
        amountPaid: parseFloat(amountPaid),
        paymentMethod,
        description,
      },
    });
  } catch (error) {
    console.error('Error updating fee collection:', error);
    res.status(500).json({ error: 'Failed to update fee collection', details: error.message });
  }
});

app.delete('/fee-collections/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;

    const sheet = await initializeFeeCollectionsSheet();
    const rows = await sheet.getRows();

    const rowIndex = rows.findIndex(r => r.get('Collection ID') === collectionId);
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Fee collection not found' });
    }

    await rows[rowIndex].delete();
    res.json({ message: 'Fee collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee collection:', error);
    res.status(500).json({ error: 'Failed to delete fee collection', details: error.message });
  }
});

// Fee Analysis and Reports Endpoints
app.get('/fee-analysis/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    // Get student info
    const studentSheet = await initializeStudentSheet();
    const studentRows = await studentSheet.getRows();
    const student = studentRows.find(row => row.get('ID') === studentId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentClass = student.get('Class');

    // Get applicable fee settings for the student's class
    const feeSettingsSheet = await initializeFeeSettingsSheet();
    const feeSettingsRows = await feeSettingsSheet.getRows();
    const applicableFees = feeSettingsRows
      .filter(row => {
        const feeClasses = (row.get('Classes') || '').split(',').map(s => s.trim());
        return feeClasses.includes(studentClass);
      })
      .map(row => ({
        feeId: row.get('Fee ID'),
        feeType: row.get('Fee Type'),
        description: row.get('Description'),
        defaultAmount: parseFloat(row.get('Amount')),
        canOverride: row.get('Can Override') === 'Y',
      }));

    // Get custom fees for the student
    const customFeesSheet = await initializeCustomStudentFeesSheet();
    const customFeesRows = await customFeesSheet.getRows();
    const customFees = customFeesRows
      .filter(row => row.get('Student ID') === studentId && row.get('Active') === 'Y')
      .map(row => ({
        feeId: row.get('Fee ID'),
        newAmount: parseFloat(row.get('New Amount')),
        reason: row.get('Reason'),
      }));

    // Get fee collections for the student
    const collectionsSheet = await initializeFeeCollectionsSheet();
    const collectionsRows = await collectionsSheet.getRows();
    let studentCollections = collectionsRows
      .filter(row => row.get('Student ID') === studentId)
      .map(row => ({
        collectionId: row.get('Collection ID'),
        date: row.get('Date'),
        feeId: row.get('Fee ID'),
        month: row.get('Month'),
        year: row.get('Year'),
        quantity: parseInt(row.get('Quantity') || 1),
        amountPaid: parseFloat(row.get('Amount Paid')),
        paymentMethod: row.get('Payment Method'),
        description: row.get('Description'),
      }));

    // Apply month/year filter if provided
    if (month && year) {
      studentCollections = studentCollections.filter(
        collection => collection.month === month && collection.year === year
      );
    }

    // Calculate fee summary
    const feeSummary = applicableFees.map(fee => {
      const customFee = customFees.find(cf => cf.feeId === fee.feeId);
      const actualAmount = customFee ? customFee.newAmount : fee.defaultAmount;
      
      const collectionsForFee = studentCollections.filter(c => c.feeId === fee.feeId);
      const totalPaid = collectionsForFee.reduce((sum, c) => sum + c.amountPaid, 0);
      const dueAmount = actualAmount - totalPaid;

      return {
        feeId: fee.feeId,
        feeType: fee.feeType,
        description: fee.description,
        defaultAmount: fee.defaultAmount,
        actualAmount,
        totalPaid,
        dueAmount,
        isOverridden: !!customFee,
        overrideReason: customFee?.reason,
        collections: collectionsForFee,
      };
    });

    const totalDue = feeSummary.reduce((sum, fee) => sum + Math.max(0, fee.dueAmount), 0);
    const totalPaid = feeSummary.reduce((sum, fee) => sum + fee.totalPaid, 0);

    res.json({
      message: 'Fee analysis retrieved successfully',
      student: {
        id: studentId,
        name: student.get('Name'),
        class: studentClass,
        number: student.get('Number'),
      },
      feeSummary,
      totals: {
        totalDue,
        totalPaid,
        netBalance: totalPaid - (feeSummary.reduce((sum, fee) => sum + fee.actualAmount, 0)),
      },
      collections: studentCollections,
    });
  } catch (error) {
    console.error('Error fetching fee analysis:', error);
    res.status(500).json({ error: 'Failed to fetch fee analysis', details: error.message });
  }
});

app.get('/fee-reports', async (req, res) => {
  try {
    const { month, year, class: classFilter, feeType } = req.query;

    // Get all fee collections
    const collectionsSheet = await initializeFeeCollectionsSheet();
    const collectionsRows = await collectionsSheet.getRows();
    let collections = collectionsRows.map(row => ({
      collectionId: row.get('Collection ID'),
      date: row.get('Date'),
      studentId: row.get('Student ID'),
      feeId: row.get('Fee ID'),
      month: row.get('Month'),
      year: row.get('Year'),
      quantity: parseInt(row.get('Quantity') || 1),
      amountPaid: parseFloat(row.get('Amount Paid')),
      paymentMethod: row.get('Payment Method'),
      description: row.get('Description'),
    }));

    // Apply filters
    if (month) {
      collections = collections.filter(c => c.month === month);
    }
    if (year) {
      collections = collections.filter(c => c.year === year);
    }

    // Get student info for class filtering
    const studentSheet = await initializeStudentSheet();
    const studentRows = await studentSheet.getRows();
    const studentMap = new Map(
      studentRows.map(row => [
        row.get('ID'),
        {
          name: row.get('Name'),
          class: row.get('Class'),
          number: row.get('Number'),
        }
      ])
    );

    if (classFilter) {
      collections = collections.filter(c => {
        const student = studentMap.get(c.studentId);
        return student && student.class === classFilter;
      });
    }

    // Get fee settings for fee type filtering
    const feeSettingsSheet = await initializeFeeSettingsSheet();
    const feeSettingsRows = await feeSettingsSheet.getRows();
    const feeMap = new Map(
      feeSettingsRows.map(row => [
        row.get('Fee ID'),
        {
          feeType: row.get('Fee Type'),
          description: row.get('Description'),
        }
      ])
    );

    if (feeType) {
      collections = collections.filter(c => {
        const fee = feeMap.get(c.feeId);
        return fee && fee.feeType === feeType;
      });
    }

    // Calculate statistics
    const totalCollections = collections.length;
    const totalAmount = collections.reduce((sum, c) => sum + c.amountPaid, 0);
    
    const paymentMethodStats = collections.reduce((acc, c) => {
      acc[c.paymentMethod] = (acc[c.paymentMethod] || 0) + c.amountPaid;
      return acc;
    }, {});

    const feeTypeStats = collections.reduce((acc, c) => {
      const fee = feeMap.get(c.feeId);
      const type = fee ? fee.feeType : 'Unknown';
      acc[type] = (acc[type] || 0) + c.amountPaid;
      return acc;
    }, {});

    const classStats = collections.reduce((acc, c) => {
      const student = studentMap.get(c.studentId);
      const className = student ? student.class : 'Unknown';
      acc[className] = (acc[className] || 0) + c.amountPaid;
      return acc;
    }, {});

    // Add student and fee info to collections
    const enrichedCollections = collections.map(c => ({
      ...c,
      student: studentMap.get(c.studentId) || {},
      fee: feeMap.get(c.feeId) || {},
    }));

    res.json({
      message: 'Fee report generated successfully',
      summary: {
        totalCollections,
        totalAmount,
        paymentMethodStats,
        feeTypeStats,
        classStats,
      },
      collections: enrichedCollections,
    });
  } catch (error) {
    console.error('Error generating fee report:', error);
    res.status(500).json({ error: 'Failed to generate fee report', details: error.message });
  }
});

// User Management Endpoints
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete Firebase Authentication account
    try {
      await admin.auth().deleteUser(id);
      console.log(`Successfully deleted Firebase Authentication account for user: ${id}`);
    } catch (authError) {
      console.error(`Failed to delete Firebase Authentication account for ${id}:`, {
        message: authError.message,
        code: authError.code,
      });
      return res.status(500).json({
        error: 'Failed to delete Firebase Authentication account',
        details: authError.message,
      });
    }

    // Fetch user from Firestore
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(`User ${id} not found in Firestore, but Authentication account was deleted`);
      return res.status(404).json({ error: 'User not found in Firestore' });
    }

    const userData = userDoc.data();
    const role = userData.role;

    // Delete role-specific Firestore data
    try {
      if (role === 'student') {
        await db.collection('students').doc(id).delete();
        console.log(`Deleted student data for ${id}`);
      } else if (role === 'staff' || role === 'admin') {
        await db.collection('staff').doc(id).delete();
        console.log(`Deleted staff data for ${id}`);
      }
    } catch (firestoreError) {
      console.error(`Error deleting role-specific data for ${id}:`, firestoreError);
    }

    // Delete user document from Firestore
    await userRef.delete();
    console.log(`Successfully deleted Firestore user document for: ${id}`);

    res.json({ message: 'User deleted successfully from Authentication and Firestore' });
  } catch (error) {
    console.error('Error deleting user:', {
      userId: req.params.id,
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check Firestore
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in Firestore' });
    }

    // Check Authentication
    try {
      const authUser = await admin.auth().getUser(id);
      res.json({
        message: 'User found',
        firestoreData: userDoc.data(),
        authData: { uid: authUser.uid, email: authUser.email },
      });
    } catch (authError) {
      res.json({
        message: 'User found in Firestore but not in Authentication',
        firestoreData: userDoc.data(),
      });
    }
  } catch (error) {
    console.error('Error fetching user:', {
      userId: req.params.id,
      message: error.message,
      code: error.code,
    });
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// GET /exam-configs
app.get('/exam-configs', async (req, res) => {
  try {
    const sheet = await initializeExamConfigsSheet();
    const rows = await sheet.getRows();
    const configs = rows.map(row => ({
      id: row.get('ID') || '',
      class: row.get('Class') || '',
      exam: row.get('Exam') || '',
      subjects: (row.get('Subjects') || '').split(',').map(s => s.trim()).filter(Boolean),
    }));
    res.json({ configs });
  } catch (error) {
    console.error('Error fetching exam configs:', error);
    res.status(500).json({ error: 'Failed to fetch exam configs', details: error.message });
  }
});

// POST /exam-configs
app.post('/exam-configs', async (req, res) => {
  try {
    const { class: className, exam, subjects } = req.body;
    if (!className || !exam || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Class, exam, and subjects are required' });
    }
    const sheet = await initializeExamConfigsSheet();
    const id = uuidv4();
    await sheet.addRow({
      ID: id,
      Class: className,
      Exam: exam,
      Subjects: subjects.join(','),
    });
    res.status(201).json({ message: 'Exam config added', config: { id, class: className, exam, subjects } });
  } catch (error) {
    console.error('Error adding exam config:', error);
    res.status(500).json({ error: 'Failed to add exam config', details: error.message });
  }
});

// GET /results
app.get('/results', async (req, res) => {
  try {
    const { id, name, class: className, exam } = req.query;
    const sheet = await initializeResultsSheet();
    const rows = await sheet.getRows();
    let results = rows.map(row => {
      let subjectsObj = {};
      try {
        subjectsObj = JSON.parse(row.get('Subjects') || '{}');
      } catch (e) {
        subjectsObj = {};
      }
      return {
        id: row.get('ID') || '',
        studentId: row.get('Student ID') || '',
        studentName: row.get('Student Name') || '',
        class: row.get('Class') || '',
        exam: row.get('Exam') || '',
        subjects: subjectsObj,
        total: row.get('Total') || '',
        rank: row.get('Rank') || ''
      };
    });
    if (id) results = results.filter(r => r.id === id);
    if (name) results = results.filter(r => r.studentName && r.studentName.includes(name));
    if (className) results = results.filter(r => r.class === className);
    if (exam) results = results.filter(r => r.exam === exam);
    res.json({ results });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results', details: error.message });
  }
});

// POST /results
app.post('/results', async (req, res) => {
  try {
    const { studentId, studentName, class: className, exam, subjects, total, rank } = req.body;
    if (!studentId || !studentName || !className || !exam || !subjects || typeof subjects !== 'object') {
      return res.status(400).json({ error: 'Missing required fields or invalid subjects' });
    }
    const sheet = await initializeResultsSheet();
    const id = uuidv4();
    const rowData = {
      ID: id,
      'Student ID': studentId,
      'Student Name': studentName,
      Class: className,
      Exam: exam,
      Subjects: JSON.stringify(subjects),
      Total: total || '',
      Rank: rank || ''
    };
    await sheet.addRow(rowData);
    res.status(201).json({ message: 'Result added', result: { id, studentId, studentName, class: className, exam, subjects, total, rank } });
  } catch (error) {
    console.error('Error adding result:', error);
    res.status(500).json({ error: 'Failed to add result', details: error.message });
  }
});

// --- Add PUT /results/:id ---
app.put('/results/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, studentName, class: className, exam, subjects, total, rank } = req.body;
    if (!studentId || !studentName || !className || !exam || !subjects || typeof subjects !== 'object') {
      return res.status(400).json({ error: 'Missing required fields or invalid subjects' });
    }
    const sheet = await initializeResultsSheet();
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);
    if (!row) {
      return res.status(404).json({ error: 'Result not found' });
    }
    row.set('Student ID', studentId);
    row.set('Student Name', studentName);
    row.set('Class', className);
    row.set('Exam', exam);
    row.set('Subjects', JSON.stringify(subjects));
    row.set('Total', total || '');
    row.set('Rank', rank || '');
    await row.save();
    res.json({ message: 'Result updated', result: { id, studentId, studentName, class: className, exam, subjects, total, rank } });
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({ error: 'Failed to update result', details: error.message });
  }
});
// --- Add DELETE /results/:id ---
app.delete('/results/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sheet = await initializeResultsSheet();
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(r => r.get('ID') === id);
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Result not found' });
    }
    await rows[rowIndex].delete();
    res.json({ message: 'Result deleted' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Failed to delete result', details: error.message });
  }
});

// Add missing initializeExamConfigsSheet
async function initializeExamConfigsSheet() {
  await initializeDoc();
  const sheet = doc.sheetsByIndex[7]; // index 7 = 8th sheet (adjust as needed)
  if (!sheet) {
    throw new Error('Exam Configs sheet not found at index 7');
  }
  await sheet.setHeaderRow(['ID', 'Class', 'Exam', 'Subjects']);
  return sheet;
}

// Start server
app.listen(PORT, async () => {
  try {
    await initializeDoc();
    console.log(`MySchool-Official Node.js Server is Running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('Failed to start server due to Google Spreadsheet initialization error:', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
});




// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Closing server...');
  if (server) {
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export for Vercel compatibility
export default app;

// Only listen if not running on Vercel
if (process.env.VERCEL !== '1') {
  var server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}