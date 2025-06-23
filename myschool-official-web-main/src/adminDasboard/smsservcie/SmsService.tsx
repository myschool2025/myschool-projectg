import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiInfo, FiClipboard, FiSend, FiUsers, FiDollarSign, FiWifi, FiX } from 'react-icons/fi';

import axios from 'axios';
import { toast } from 'sonner';
import 'jspdf-autotable';
import Loading from '../../components/loader/Loading';
import classesData from '@/lib/classes.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';


interface Student {
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

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const ERROR_CODES: { [key: number]: string } = {
  202: "SMS Submitted Successfully",
  1001: "Invalid Number",
  1002: "Sender ID not correct or disabled",
  1003: "Please fill all required fields or contact your System Administrator",
  1005: "Internal Error",
  1006: "Balance Validity Not Available",
  1007: "Balance Insufficient",
  1011: "User ID not found",
  1012: "Masking SMS must be sent in Bengali",
  1013: "Sender ID has not found Gateway by API key",
  1014: "Sender Type Name not found using this sender by API key",
  1015: "Sender ID has not found any valid Gateway by API key",
  1016: "Sender Type Name Active Price Info not found by this sender ID",
  1017: "Sender Type Name Price Info not found by this sender ID",
  1018: "The Owner of this account is disabled",
  1019: "The Sender Type Name Price of this account is disabled",
  1020: "The parent of this account is not found",
  1021: "The parent active Sender Type Name price of this account is not found",
  1031: "Your Account Not Verified, Please Contact Administrator",
  1032: "IP Not whitelisted"
};

const PLACEHOLDERS = [
  { key: '{student_name}', label: 'Student Name' },
  { key: '{english_name}', label: 'English Name' },
  { key: '{class}', label: 'Class' },
  { key: '{mother_name}', label: 'Mother Name' },
  { key: '{father_name}', label: 'Father Name' },
];

const SMSService = () => {
  const [message, setMessage] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [smsRate] = useState(0.35); // Taka per SMS part
  const [totalCost, setTotalCost] = useState(0);
  const [ipAddress, setIpAddress] = useState('');
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const log = (message: string) => {
    console.log(`[SMSService] ${message}`);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`].slice(-10));
  };

  const insertPlaceholder = (placeholder: string) => {
    setMessage(prev => `${prev}${placeholder} `);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      log('Fetching initial data...');
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        setIpAddress(ipData.ip);

        const balanceResponse = await axios.get(`${BACKEND_URL}/getBalance`);
        if (balanceResponse.status === 200 && balanceResponse.data.balance !== undefined) {
          setApiStatus('connected');
          setAccountBalance(parseFloat(balanceResponse.data.balance));
        } else {
          setApiStatus('error');
          log(`SMS provider error: ${balanceResponse.data.error || 'Unknown error'}`);
        }
      } catch (error) {
        setApiStatus('error');
        log(`Initialization error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchStudentsByClass = useCallback(async () => {
    if (!selectedClass) return;
    setIsLoading(true);
    log(`Fetching students for class: ${selectedClass}`);
    try {
      const response = await axios.get(`${BACKEND_URL}/students`, {
        params: {
          page: currentPage - 1,
          limit: itemsPerPage,
          class: selectedClass,
        },
      });
      const { students: fetchedStudents, total } = response.data;
      setStudents(fetchedStudents.map((s: any) => ({
        id: s.id,
        name: s.name,
        number: s.number,
        class: s.class,
        description: s.description,
        englishName: s.englishName,
        motherName: s.motherName,
        fatherName: s.fatherName,
        photoUrl: s.photoUrl,
      })));
      setTotalStudents(total);
      log(`Fetched ${fetchedStudents.length} of ${total} students`);
    } catch (error) {
      log(`Error fetching students: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchStudentsByClass();
  }, [fetchStudentsByClass]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.number.includes(searchTerm)
  );

  const handleNumberSelection = (number: string) => {
    setSelectedNumbers(prev =>
      prev.includes(number) ? prev.filter(n => n !== number) : [...prev, number]
    );
  };

  const generatePersonalizedMessage = (student: Student) => {
    let personalizedMessage = message;
    personalizedMessage = personalizedMessage.replace('{student_name}', student.name);
    personalizedMessage = personalizedMessage.replace('{english_name}', student.englishName);
    personalizedMessage = personalizedMessage.replace('{class}', student.class);
    personalizedMessage = personalizedMessage.replace('{mother_name}', student.motherName);
    personalizedMessage = personalizedMessage.replace('{father_name}', student.fatherName);
    return personalizedMessage;
  };

  useEffect(() => {
    const calculateCost = () => {
      const gsm7BitExChars = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!\"#$%&'()*+,\-./:;<=>?-siÄÖÑÜ§¿äöñüà^{}\[~\]|€]+$/;

      const maxLength = selectedNumbers.reduce((max, number) => {
        const student = students.find(s => s.number === number);
        if (student) {
          const personalizedMessage = generatePersonalizedMessage(student);
          const isGSM7 = gsm7BitExChars.test(personalizedMessage);
          return Math.max(max, isGSM7 ? 160 : 70);
        }
        return max;
      }, 160);

      const maxMessageLength = selectedNumbers.reduce((max, number) => {
        const student = students.find(s => s.number === number);
        if (student) {
          const personalizedMessage = generatePersonalizedMessage(student);
          return Math.max(max, personalizedMessage.length);
        }
        return max;
      }, message.length);

      const parts = Math.ceil(maxMessageLength / maxLength);
      const cost = parts * selectedNumbers.length * smsRate;
      setTotalCost(cost);
    };
    calculateCost();
  }, [message, selectedNumbers, smsRate, students]);

  const sendSMS = async () => {
    if (!selectedNumbers.length || !message) {
      toast('Please select recipients and enter a message!');
      return;
    }
    if (totalCost > (accountBalance || 0)) {
      alert('Insufficient balance!');
      return;
    }

    setIsLoading(true);
    try {
      const promises = selectedNumbers.map(async (number) => {
        const student = students.find(s => s.number === number);
        if (!student) return;
        const personalizedMessage = generatePersonalizedMessage(student);
        const response = await axios.post(`${BACKEND_URL}/sendSMS`, {
          number,
          message: personalizedMessage,
        });
        return response.data;
      });

      const results = await Promise.all(promises);
      const allSuccessful = results.every(result => result?.response_code === 202);

      if (allSuccessful) {
        alert('All SMS sent successfully!');
        setMessage('');
        setSelectedNumbers([]);
        setAccountBalance(prev => (prev ? prev - totalCost : null));
        log('All SMS sent successfully');
      } else {
        const errors = results.map((result, index) =>
          result?.response_code !== 202
            ? `SMS to ${selectedNumbers[index]} failed: ${ERROR_CODES[result?.response_code] || 'Unknown error'}`
            : null
        ).filter(Boolean);
        alert(`Some SMS failed:\n${errors.join('\n')}`);
        log(`Some SMS failed: ${errors.join(', ')}`);
      }
    } catch (error) {
      alert('Failed to send SMS.');
      log(`SMS sending error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  };

  const AnimatedGradient = () => (
    <motion.div
      className="absolute inset-0 z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-green-100 to-purple-100 opacity-50 animate-gradient-x" />
    </motion.div>
  );

  const TutorialOverlay = () => (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div style={glassStyle} className="p-8 max-w-2xl relative">
        <button
          onClick={() => setShowTutorial(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FiInfo className="text-blue-500" /> SMS Dashboard Guide
        </h2>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">1</div>
            <div>
              <h3 className="font-semibold">Select a Class</h3>
              <p className="text-gray-600">Choose the student class from the dropdown to load recipients</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">2</div>
            <div>
              <h3 className="font-semibold">Craft Your Message</h3>
              <p className="text-gray-600">Use placeholders to personalize messages for each student</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">3</div>
            <div>
              <h3 className="font-semibold">Review & Send</h3>
              <p className="text-gray-600">Check estimated costs and balance before sending</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setMessage(prev => prev + text);
    } catch (error) {
      alert('Failed to paste from clipboard.');
      log(`Clipboard paste error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedGradient />
      {isLoading && <div>Loaidng..</div>} {/* Add Loading component here */}
      {showTutorial && <TutorialOverlay />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 p-6 max-w-6xl mx-auto"
      >
        {/* Status Ribbon */}
        <motion.div
          style={glassStyle}
          className="flex flex-wrap gap-4 items-center justify-between p-4 mb-8 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <FiWifi className={`text-lg ${apiStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`} />
            <span className="font-medium">Connection: </span>
            <span className={`${apiStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {apiStatus === 'connected' ? 'Secure Connection' : 'Connection Error'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FiDollarSign className="text-green-500" />
            <span className="font-medium">Balance: </span>
            <span className="font-bold text-green-700">
              {accountBalance !== null ? `${accountBalance.toFixed(2)} টাকা` : '...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FiClipboard className="text-blue-500" />
            <span className="font-medium">Recipients: </span>
            <span className="font-bold text-blue-700">{selectedNumbers.length}</span>
          </div>
        </motion.div>

        {/* Message Composition */}
        <motion.div
          style={glassStyle}
          className="mb-8 p-6 shadow-lg"
          whileHover={{ scale: 1.005 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiSend className="text-blue-500" /> Compose Message
          </h3>
          <textarea
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-300 bg-white/50 resize-none min-h-[150px]"
            placeholder="✍️ Start typing your message here... Use placeholders below to personalize!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {PLACEHOLDERS.map(({ key, label }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => insertPlaceholder(key)}
                className="p-2 bg-white border rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center text-sm"
                disabled={isLoading}
              >
                <span className="text-blue-600">{label}</span>
              </motion.button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-blue-100 px-2 py-1 rounded">Characters: {message.length}</span>
              <span className="bg-green-100 px-2 py-1 rounded">
                SMS Parts: {Math.ceil(
                  selectedNumbers.reduce((max, number) => {
                    const student = students.find(s => s.number === number);
                    if (student) {
                      const personalizedMessage = generatePersonalizedMessage(student);
                      return Math.max(max, personalizedMessage.length);
                    }
                    return max;
                  }, message.length) / 160
                )}
              </span>
              <span className="bg-purple-100 px-2 py-1 rounded">
                Total Cost: {totalCost.toFixed(2)} টাকা
              </span>
            </div>
            <button
              onClick={pasteFromClipboard}
              className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
              disabled={isLoading}
            >
              <FiClipboard /> Paste
            </button>
          </div>
        </motion.div>

        {/* Recipient Selection */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <motion.div
            style={glassStyle}
            className="p-4 md:p-6 shadow-lg"
            whileHover={{ scale: 1.005 }}
          >
            <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
              <FiUsers className="text-green-500" /> Select Class
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <select
                className="w-full md:w-2/3 p-3 border rounded-xl bg-white/50 focus:ring-2 focus:ring-green-300"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                  setSelectedNumbers([]);
                }}
                disabled={isLoading}
              >
                <option value="">Choose a class...</option>
                {CLASS_OPTIONS.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <div className="flex gap-2 w-full md:w-1/3">
                <button
                  onClick={async () => {
                    if (!selectedClass) {
                      alert('Please select a class first!');
                      return;
                    }
                    try {
                      const response = await axios.get(`${BACKEND_URL}/students/export-csv`, {
                        params: { class: selectedClass },
                        responseType: 'blob',
                      });
                      const csvUrl = URL.createObjectURL(response.data);
                      const csvLink = document.createElement('a');
                      csvLink.href = csvUrl;
                      csvLink.download = `${selectedClass}_students.csv`;
                      csvLink.click();
                      URL.revokeObjectURL(csvUrl);
                      log(`Exported ${selectedClass} students to CSV`);
                    } catch (error) {
                      log(`CSV Export error: ${error instanceof Error ? error.message : String(error)}`);
                      alert('Failed to export CSV');
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                  disabled={isLoading}
                >
                  Export CSV
                </button>
<button
  onClick={async () => {
    if (!selectedClass) {
      alert('Please select a class first!');
      return;
    }
    try {
      const response = await axios.get(`${BACKEND_URL}/students`, {
        params: { class: selectedClass },
      });
      const studentsData = response.data.students as Student[];
      const totalStudents = response.data.total;
      const exportDate = new Date().toLocaleDateString();

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>MySchool - ${selectedClass} - Students</title>
              <style>
                @media print {
                  @page { margin: 2cm; }
                  th {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                }
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  color: #333;
                  line-height: 1.5;
                }
                .container {
                  max-width: 1200px;
                  margin: 0 auto;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 2px solid #3498db;
                  padding-bottom: 15px;
                }
                .header h1 {
                  color: #2c3e50;
                  margin: 0;
                  font-size: 28px;
                  font-weight: 700;
                }
                .header p {
                  color: #555;
                  font-size: 14px;
                  margin: 5px 0 0;
                }
                .stats {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 8px;
                  margin-bottom: 20px;
                  display: flex;
                  justify-content: space-between;
                  font-size: 14px;
                  border: 1px solid #ddd;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 12px;
                  text-align: left;
                  font-size: 14px;
                }
                th {
                  background-color: #3498db;
                  color: #fff;
                  font-weight: 600;
                  text-transform: uppercase;
                }
                tr:nth-child(even) {
                  background-color: #f9f9f9;
                }
                tr:hover {
                  background-color: #f1f1f1;
                }
                img {
                  max-width: 100px;
                  height: auto;
                  border-radius: 4px;
                  display: block;
                }
                .footer {
                  margin-top: 20px;
                  text-align: center;
                  color: #777;
                  font-size: 12px;
                  border-top: 1px solid #ddd;
                  padding-top: 15px;
                }
                @media (max-width: 768px) {
                  table, th, td {
                    font-size: 12px;
                    padding: 8px;
                  }
                  img {
                    max-width: 60px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>MySchool - ${selectedClass} - Students</h1>
                  <p>Generated on: ${exportDate}</p>
                </div>
                <div class="stats">
                  <span>Total Students: ${totalStudents}</span>
                  <span>Exported on: ${exportDate}</span>
                </div>
                <table>
                  <tr>
                    <th>Name</th>
                    <th>English Name</th>
                    <th>Number</th>
                    <th>Class</th>
                    <th>Description</th>
                    <th>Mother Name</th>
                    <th>Father Name</th>
                    <th>Photo</th>
                  </tr>
                  ${studentsData
                    .map(
                      (student) => `
                    <tr>
                      <td>${student.name || '-'}</td>
                      <td>${student.englishName || '-'}</td>
                      <td>${student.number || '-'}</td>
                      <td>${student.class || '-'}</td>
                      <td>${student.description || '-'}</td>
                      <td>${student.motherName || '-'}</td>
                      <td>${student.fatherName || '-'}</td>
                      <td>${
                        student.photoUrl
                          ? `<img src="${student.photoUrl}" alt="${student.name || 'Student'}'s photo" onerror="this.style.display='none';this.nextSibling.style.display='block'" /><span style="display:none">Image not available</span>`
                          : 'No photo'
                      }</td>
                    </tr>
                  `
                    )
                    .join('')}
                </table>
                <div class="footer">
                  Generated by MySchool Official Website • https://myschool-offical.netlify.app
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        log(`Exported ${selectedClass} students to PDF`);
      }
    } catch (error) {
      log(`PDF Export error: ${error instanceof Error ? error.message : String(error)}`);
      alert('Failed to export PDF');
    }
  }}
  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
  disabled={isLoading}
  >
    Export PDF
</button>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={glassStyle}
            className="p-4 md:p-6 shadow-lg"
            whileHover={{ scale: 1.005 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <FiUsers className="text-purple-500" /> Students
                <span className="text-sm font-normal text-gray-500">({selectedNumbers.length} selected)</span>
              </h3>
              <input
                type="text"
                placeholder="🔍 Search students..."
                className="w-full p-2 border rounded-lg bg-white/50 focus:ring-2 focus:ring-purple-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="h-64 overflow-y-auto border rounded-xl bg-white/50 p-2">
              <AnimatePresence>
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-4"
                  >
                    Loading...
                  </motion.div>
                ) : filteredStudents.length === 0 ? (
                  <motion.div
                    key="no-students"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-4"
                  >
                    No students found
                  </motion.div>
                ) : (
                  filteredStudents.map(student => (
                    <motion.label
                      key={student.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="flex items-center mb-2 hover:bg-blue-100 p-2 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNumbers.includes(student.number)}
                        onChange={() => handleNumberSelection(student.number)}
                        className="mr-2"
                        disabled={isLoading}
                      />
                      <span>{student.name} ({student.number})</span>
                    </motion.label>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={() => setSelectedNumbers(filteredStudents.map(s => s.number))}
                  className="text-sm md:text-base px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 w-full md:w-auto"
                  disabled={isLoading}
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedNumbers([])}
                  className="text-sm md:text-base px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 w-full md:w-auto"
                  disabled={isLoading}
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full md:w-auto"
                >
                  Prev
                </button>
                <span className="px-3 py-2 text-center">Page {currentPage}</span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={students.length < itemsPerPage || isLoading}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full md:w-auto"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Send Button */}
        <motion.div
          className="mt-8 text-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <button
            onClick={sendSMS}
            disabled={apiStatus !== 'connected' || !selectedNumbers.length || !message || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : (
              `📤 Send SMS to ${selectedNumbers.length} Recipients`
            )}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Estimated Cost: {totalCost.toFixed(2)} টাকা • SMS Parts: {Math.ceil(
              selectedNumbers.reduce((max, number) => {
                const student = students.find(s => s.number === number);
                if (student) {
                  const personalizedMessage = generatePersonalizedMessage(student);
                  return Math.max(max, personalizedMessage.length);
                }
                return max;
              }, message.length) / 160
            )}
          </p>
        </motion.div>

        {/* Activity Logs */}
        <motion.div
          style={glassStyle}
          className="mt-8 p-6 shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiClipboard className="text-blue-500" /> Activity Logs
          </h3>
          <div className="h-32 overflow-y-auto border rounded-xl bg-white/50 p-2 text-sm">
            {logs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-1 border-b last:border-b-0"
              >
                {log}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SMSService;