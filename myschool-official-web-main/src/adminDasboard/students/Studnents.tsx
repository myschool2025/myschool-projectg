import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash, Edit, Download, X, Settings, User, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import classesData from '@/lib/classes.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Updated interface to match server API structure
interface Student {
  id: string;
  name: string;
  number: string; // Phone number
  class: string;
  description: string;
  englishName: string;
  motherName: string;
  fatherName: string;
  photoUrl: string;
  academicYear: string;
  section: string;
  shift: string;
}

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const SHIFT_OPTIONS = [
  "Morning", "Day", "Evening"
];

const SECTION_OPTIONS = [
  "A", "B", "C", "D", "E", "F"
];

const ACADEMIC_YEAR_OPTIONS = [
  "2025", "2026", "2027", "2028", "2029", "2030"
];

// Performance optimization: Debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Performance optimization: Memoized search function
const useSearchStudents = (students: Student[], searchQuery: string, searchField: string) => {
  return useMemo(() => {
    if (!searchQuery.trim()) return students;

    const searchLower = searchQuery.toLowerCase();
    return students.filter(student => {
      switch (searchField) {
        case 'name':
          return student.name.toLowerCase().includes(searchLower) ||
                 student.englishName.toLowerCase().includes(searchLower);
        case 'number':
          return student.number.toLowerCase().includes(searchLower);
        case 'class':
          return student.class.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            student.name.toLowerCase().includes(searchLower) ||
            student.englishName.toLowerCase().includes(searchLower) ||
            student.number.toLowerCase().includes(searchLower) ||
            student.class.toLowerCase().includes(searchLower) ||
            student.fatherName.toLowerCase().includes(searchLower) ||
            student.motherName.toLowerCase().includes(searchLower)
          );
      }
    });
  }, [students, searchQuery, searchField]);
};

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [displayOptions, setDisplayOptions] = useState({
    showName: true,
    showNumber: true,
    showClass: true,
    showDescription: true,
    showEnglishName: true,
    showFatherName: true,
    showMotherName: true,
    showPhoto: true,
    showStudentId: true,
    showAcademicYear: false,
    showSection: false,
    showShift: false,
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [operationStatus, setOperationStatus] = useState<'idle' | 'uploading'>('idle');
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [gridLayout, setGridLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'number' | 'class'>('all');
  const [isSearching, setIsSearching] = useState(false);

  const { toast } = useToast();

  // Performance optimization: Memoized filtered students
  const filteredStudents = useSearchStudents(students, searchQuery, searchField);

  // Performance optimization: Memoized class-filtered students
  const classFilteredStudents = useMemo(() => {
    if (!selectedClass) return filteredStudents;
    return filteredStudents.filter(student => student.class === selectedClass);
  }, [filteredStudents, selectedClass]);

  // Fetch students from server with performance optimization
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
          page: currentPage,
          limit: itemsPerPage,
      };

      // Add search by number if provided
      if (searchQuery && searchField === 'number') {
        params.number = searchQuery;
      }

      // Add class filter if selected
      if (selectedClass) {
        params.class = selectedClass;
      }

      const response = await axios.get(`${BACKEND_URL}/students`, { params });
      
      if (response.data && response.data.students) {
      setStudents(response.data.students);
        setTotalStudents(response.data.total || response.data.students.length);
      } else {
        setStudents([]);
        setTotalStudents(0);
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch students",
      });
      setStudents([]);
      setTotalStudents(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, searchField, selectedClass, toast]);

  // Performance optimization: Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setIsSearching(true);
      setSearchQuery(query);
      if (searchField === 'number') {
        // For number search, fetch from server
        fetchStudents();
      }
      setIsSearching(false);
    }, 300),
    [searchField, fetchStudents]
  );

  // Upload image to ImgBB with proper error handling
  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        params: {
          key: import.meta.env.VITE_IMGBB_API_KEY || 'YOUR_IMGBB_API_KEY', // Add to your .env file
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.data && response.data.data.url) {
        return response.data.data.url;
      } else {
        throw new Error('Invalid response from ImgBB');
      }
    } catch (error: any) {
      console.error('ImgBB upload error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to upload image');
    }
  };

  // Handle image upload with performance optimization
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Performance optimization: File size validation
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Image size should be less than 5MB",
      });
      return;
    }

    // Performance optimization: File type validation
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a valid image file",
      });
      return;
    }

    setOperationStatus('uploading');
    try {
      const imageUrl = await uploadImageToImgBB(file);
      if (editStudent) {
        setEditStudent({ ...editStudent, photoUrl: imageUrl });
      }
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload image",
      });
    } finally {
      setOperationStatus('idle');
    }
  };

  // Handle save student with performance optimization
  const handleSave = async () => {
    if (!editStudent?.name || !editStudent?.class) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and Class are required",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Remove id field for new students (server generates it)
      const studentData = { ...editStudent };
      if (!studentData.id) {
        delete studentData.id;
      }
      
      if (editStudent.id) {
        // Update existing student
        await axios.put(`${BACKEND_URL}/students/${editStudent.id}`, studentData);
        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        // Add new student
        await axios.post(`${BACKEND_URL}/students`, studentData);
        toast({
          title: "Success",
          description: "Student added successfully",
        });
      }
      
      setShowModal(false);
      setEditStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to save student",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete student
  const handleDelete = async (studentId: string) => {
    try {
      setIsLoading(true);
      await axios.delete(`${BACKEND_URL}/students/${studentId}`);
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      setShowDeleteModal(null);
      fetchStudents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to delete student",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export to CSV
  const handleExportToCSV = async () => {
    try {
      const params: any = {};
      if (selectedClass) {
        params.class = selectedClass;
      }

      const response = await axios.get(`${BACKEND_URL}/students/export-csv`, {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students${selectedClass ? `_${selectedClass}` : ''}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "CSV exported successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to export CSV",
      });
    }
  };

  // Handle photo download
  const handlePhotoDownload = async (student: Student) => {
    if (!student.photoUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No photo available for this student",
      });
      return;
    }

    try {
      const response = await axios.get(student.photoUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${student.name}_photo.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Photo downloaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download photo",
      });
    }
  };

  // Effects with performance optimization
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('studentDisplaySettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.displayOptions) {
          setDisplayOptions(settings.displayOptions);
        }
        if (settings.gridLayout) {
          setGridLayout(settings.gridLayout);
        }
        if (settings.itemsPerPage) {
          setItemsPerPage(settings.itemsPerPage);
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settingsToSave = {
      displayOptions,
      gridLayout,
      itemsPerPage
    };
    localStorage.setItem('studentDisplaySettings', JSON.stringify(settingsToSave));
  }, [displayOptions, gridLayout, itemsPerPage]);

  // Calculate pagination
  const totalPages = Math.ceil(totalStudents / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalStudents);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600">Manage student profiles and information</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
            <button
              onClick={handleExportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={20} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                setEditStudent({
                  id: '',
                  name: '',
                  number: '',
                  class: '',
                  description: '',
                  englishName: '',
                  motherName: '',
                  fatherName: '',
                  photoUrl: '',
                  academicYear: '2025',
                  section: 'A',
                  shift: 'Morning',
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              <span>Add Student</span>
            </button>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
          </div>
            <div className="flex gap-2">
          <select
            value={searchField}
                onChange={(e) => setSearchField(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Fields</option>
            <option value="name">Name</option>
                <option value="number">Phone Number</option>
            <option value="class">Class</option>
          </select>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {CLASS_OPTIONS.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
          </select>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          ) : classFilteredStudents.length > 0 ? (
            <>
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Students ({classFilteredStudents.length} of {totalStudents})
                  </h2>
          <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{endIndex} of {totalStudents}
          </div>
                </div>
        </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {classFilteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {displayOptions.showPhoto && student.photoUrl && (
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                            loading="lazy"
                          />
                        )}
                        {displayOptions.showName && (
                          <h3 className="font-semibold text-gray-900 text-center">{student.name}</h3>
                        )}
                        {displayOptions.showEnglishName && student.englishName && (
                          <p className="text-sm text-gray-600 text-center">{student.englishName}</p>
                        )}
                        {displayOptions.showStudentId && (
                          <div className="text-center mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ID: {student.id}
                            </span>
                          </div>
                        )}
                      </div>
                      </div>

                    <div className="space-y-2 text-sm">
                      {displayOptions.showNumber && (
                        <p><span className="font-medium">Phone:</span> {student.number}</p>
                      )}
                      {displayOptions.showClass && (
                        <p><span className="font-medium">Class:</span> {student.class}</p>
                      )}
                      {displayOptions.showAcademicYear && (
                        <p><span className="font-medium">Year:</span> {student.academicYear}</p>
                      )}
                      {displayOptions.showSection && (
                        <p><span className="font-medium">Section:</span> {student.section}</p>
                      )}
                      {displayOptions.showShift && (
                        <p><span className="font-medium">Shift:</span> {student.shift}</p>
                      )}
                      {displayOptions.showDescription && student.description && (
                        <p><span className="font-medium">Description:</span> {student.description}</p>
                      )}
                      {displayOptions.showFatherName && student.fatherName && (
                        <p><span className="font-medium">Father:</span> {student.fatherName}</p>
                      )}
                      {displayOptions.showMotherName && student.motherName && (
                        <p><span className="font-medium">Mother:</span> {student.motherName}</p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                          <button
                        onClick={() => {
                          setEditStudent(student);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Student"
                      >
                        <Edit size={16} />
                          </button>
                        <button
                        onClick={() => setShowDeleteModal(student.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Student"
                        >
                        <Trash size={16} />
                        </button>
                      {student.photoUrl && (
                        <button
                          onClick={() => handlePhotoDownload(student)}
                          className="text-green-600 hover:text-green-800"
                          title="Download Photo"
                        >
                          <Download size={16} />
                        </button>
                      )}
                  </div>
                </motion.div>
                ))}
        </div>

        {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
            <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Previous
            </button>
                    <span className="text-gray-600">
                      Page {currentPage + 1} of {totalPages}
                    </span>
            <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Next
            </button>
          </div>
          </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by adding your first student.'}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Student Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {editStudent?.id ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <button onClick={() => setShowModal(false)}>
                    <X size={24} />
                  </button>
                </div>

                {editStudent && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                      <input
                          type="text"
                          value={editStudent.name}
                          onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">English Name</label>
                        <input
                          type="text"
                          value={editStudent.englishName}
                          onChange={(e) => setEditStudent({ ...editStudent, englishName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Class *</label>
                      <select
                          value={editStudent.class}
                          onChange={(e) => setEditStudent({ ...editStudent, class: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Class</option>
                          {CLASS_OPTIONS.map((className) => (
                            <option key={className} value={className}>
                              {className}
                            </option>
                        ))}
                      </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number *</label>
                      <input
                          type="text"
                          value={editStudent.number}
                          onChange={(e) => setEditStudent({ ...editStudent, number: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="01XXXXXXXXX"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Father's Name</label>
                      <input
                          type="text"
                          value={editStudent.fatherName}
                          onChange={(e) => setEditStudent({ ...editStudent, fatherName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mother's Name</label>
                      <input
                          type="text"
                          value={editStudent.motherName}
                          onChange={(e) => setEditStudent({ ...editStudent, motherName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Academic Year</label>
                        <select
                          value={editStudent.academicYear}
                          onChange={(e) => setEditStudent({ ...editStudent, academicYear: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {ACADEMIC_YEAR_OPTIONS.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                    </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Section</label>
                        <select
                          value={editStudent.section}
                          onChange={(e) => setEditStudent({ ...editStudent, section: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {SECTION_OPTIONS.map((section) => (
                            <option key={section} value={section}>
                              {section}
                            </option>
                          ))}
                        </select>
                  </div>
                  <div>
                        <label className="block text-sm font-medium mb-1">Shift</label>
                        <select
                          value={editStudent.shift}
                          onChange={(e) => setEditStudent({ ...editStudent, shift: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {SHIFT_OPTIONS.map((shift) => (
                            <option key={shift} value={shift}>
                              {shift}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        value={editStudent.description}
                        onChange={(e) => setEditStudent({ ...editStudent, description: e.target.value })}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                      <label className="block text-sm font-medium mb-1">Photo</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editStudent.photoUrl}
                          onChange={(e) => setEditStudent({ ...editStudent, photoUrl: e.target.value })}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter photo URL or upload image"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          {operationStatus === 'uploading' ? 'Uploading...' : 'Upload'}
                        </label>
                      </div>
                      {editStudent.photoUrl && (
                        <div className="mt-2">
                          <img
                            src={editStudent.photoUrl}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                    </div>
                      )}
                  </div>

                    <div className="flex gap-2 pt-4">
                  <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                        {editStudent.id ? 'Update Student' : 'Add Student'}
                  </button>
                  <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                  </button>
                </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold mb-4">Delete Student</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this student? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                    <button
                    onClick={() => handleDelete(showDeleteModal)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                    </button>
                    <button
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                    </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Display Settings</h2>
                  <button onClick={() => setShowSettingsModal(false)}>
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Display Options Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Card Display Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(displayOptions).map(([key, value]) => (
                        <label key={key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                            onChange={(e) =>
                              setDisplayOptions(prev => ({
                                ...prev,
                                [key]: e.target.checked
                              }))
                            }
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
                  </div>

                  {/* Layout Options Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Layout Options</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grid Layout
                        </label>
                        <select
                          value={gridLayout}
                          onChange={(e) => setGridLayout(e.target.value as 'grid' | 'list')}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="grid">Grid View (Cards)</option>
                          <option value="list">List View (Table)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Items Per Page
                        </label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={15}>15 items</option>
                          <option value={30}>30 items</option>
                          <option value={50}>50 items</option>
                          <option value={100}>100 items</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setDisplayOptions({
                            showName: true,
                            showNumber: true,
                            showClass: true,
                            showDescription: false,
                            showEnglishName: true,
                            showFatherName: true,
                            showMotherName: true,
                            showPhoto: true,
                            showStudentId: true,
                            showAcademicYear: false,
                            showSection: false,
                            showShift: false,
                          });
                          toast({
                            title: "Settings Applied",
                            description: "Default display settings applied",
                          });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Apply Default
                      </button>
                      
                      <button
                        onClick={() => {
                          setDisplayOptions({
                            showName: true,
                            showNumber: true,
                            showClass: true,
                            showDescription: true,
                            showEnglishName: true,
                            showFatherName: true,
                            showMotherName: true,
                            showPhoto: true,
                            showStudentId: true,
                            showAcademicYear: true,
                            showSection: true,
                            showShift: true,
                          });
                          toast({
                            title: "Settings Applied",
                            description: "Show all fields applied",
                          });
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Show All Fields
                      </button>
                      
                      <button
                        onClick={() => {
                          setDisplayOptions({
                            showName: true,
                            showNumber: true,
                            showClass: true,
                            showDescription: false,
                            showEnglishName: false,
                            showFatherName: false,
                            showMotherName: false,
                            showPhoto: false,
                            showStudentId: true,
                            showAcademicYear: false,
                            showSection: false,
                            showShift: false,
                          });
                          toast({
                            title: "Settings Applied",
                            description: "Minimal view applied",
                          });
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                      >
                        Minimal View
                      </button>
                      
                      <button
                        onClick={() => {
                          setDisplayOptions({
                            showName: true,
                            showNumber: true,
                            showClass: true,
                            showDescription: true,
                            showEnglishName: true,
                            showFatherName: true,
                            showMotherName: true,
                            showPhoto: true,
                            showStudentId: true,
                            showAcademicYear: true,
                            showSection: true,
                            showShift: true,
                          });
                          setGridLayout('list');
                          setItemsPerPage(50);
                          toast({
                            title: "Settings Applied",
                            description: "Detailed list view applied",
                          });
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Detailed List
                      </button>
                    </div>
                  </div>

                  {/* Settings Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Current Settings Summary</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Layout: {gridLayout === 'grid' ? 'Grid View' : 'List View'}</p>
                      <p>• Items per page: {itemsPerPage}</p>
                      <p>• Visible fields: {Object.values(displayOptions).filter(Boolean).length} of {Object.keys(displayOptions).length}</p>
                      <p>• Student ID: {displayOptions.showStudentId ? 'Visible' : 'Hidden'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Save settings to localStorage for persistence
                      localStorage.setItem('studentDisplaySettings', JSON.stringify({
                        displayOptions,
                        gridLayout,
                        itemsPerPage
                      }));
                      toast({
                        title: "Settings Saved",
                        description: "Your display settings have been saved",
                      });
                      setShowSettingsModal(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Settings
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Students;