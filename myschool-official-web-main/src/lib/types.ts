export interface StudentData {
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phoneNumber: string;
  grade: string;
  section: string;
  enrollmentDate: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  emergencyContact: string;
  medicalInfo?: string;
  previousSchool?: string;
  createdAt: any;
  updatedAt: any;
}

export interface StaffData {
  staffId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phoneNumber: string;
  email: string;
  position: string;
  department: string;
  hireDate: string;
  emergencyContact: string;
  medicalInfo?: string;
  qualifications?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface User {
  id: string;
  email: string | null;
  role: string;
  verified: boolean;
  createdAt: any;
  studentData?: StudentData;
  staffData?: StaffData;
}

// Fee Collection Types
export interface FeeCollection {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  collectionType: 'monthly_fee' | 'transport_fee' | 'books' | 'khata' | 'other';
  amount: number;
  description?: string;
  collectedBy: string;
  collectedAt: any;
  paymentMethod: 'cash' | 'mobile_banking' | 'bank_transfer';
  receiptNumber: string;
  status: 'paid' | 'pending' | 'cancelled';
  guardianName?: string;
  guardianPhone?: string;
  notes?: string;
}

export interface FeeStructure {
  id: string;
  class: string;
  monthlyFee: number;
  transportFee: number;
  bookFee: number;
  khataFee: number;
  otherFees: {
    name: string;
    amount: number;
  }[];
  academicYear: string;
  effectiveFrom: any;
  effectiveTo?: any;
  isActive: boolean;
}

export interface FeeReport {
  totalCollected: number;
  monthlyFeeCollected: number;
  transportFeeCollected: number;
  booksCollected: number;
  khataCollected: number;
  otherCollected: number;
  collectionCount: number;
  dateRange: {
    start: any;
    end: any;
  };
}

// Legacy Student Type (from existing Students.tsx)
export interface StudentLegacy {
  id?: string;
  name: string;
  number: string;
  class: string;
  description?: string;
  englishName: string;
  motherName: string;
  fatherName: string;
  photoUrl?: string;
}

// Bulk Upload Types
export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: string[];
  duplicates: string[];
}

// Fee Structure with Class Details
export interface ClassFeeStructure {
  id: string;
  className: string;
  monthlyFee: number;
  transportFee: number;
  bookFee: number;
  khataFee: number;
  otherFees: {
    name: string;
    amount: number;
    description?: string;
  }[];
  academicYear: string;
  effectiveFrom: any;
  effectiveTo?: any;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// Firestore Student Type with enhanced fields
export interface FirestoreStudent {
  id?: string;
  studentId: string; // Unique student ID (e.g., 2500001)
  name: string;
  englishName?: string;
  class: string;
  section?: string;
  shift?: 'Morning' | 'Day' | 'Evening';
  academicYear?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  number: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  email?: string;
  photoUrl?: string;
  description?: string;
  isActive?: boolean;
  enrollmentDate?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Google Sheets Import Result
export interface GoogleSheetsImportResult {
  success: number;
  failed: number;
  errors: string[];
  duplicates: string[];
  totalProcessed: number;
}