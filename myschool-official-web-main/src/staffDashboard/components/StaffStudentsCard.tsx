
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  ChevronDown, 
  Filter, 
  Download, 
  User, 
  BarChart,
  Sparkles,
  FileDown
} from "lucide-react";

// Mock students data
const studentsData = [
  {
    id: 1,
    name: 'Ahmed Khan',
    rollNumber: '2023001',
    class: 'Class 9A',
    attendance: 92,
    lastAttendance: 'Present',
    performance: 'Good',
    contact: '+880 1712345678',
    parent: 'Kamal Khan',
    photoUrl: '',
    tags: ['Needs Attention'],
  },
  {
    id: 2,
    name: 'Fatima Rahman',
    rollNumber: '2023002',
    class: 'Class 9A',
    attendance: 98,
    lastAttendance: 'Present',
    performance: 'Excellent',
    contact: '+880 1812345678',
    parent: 'Rahim Rahman',
    photoUrl: '',
    tags: ['High Performer'],
  },
  {
    id: 3,
    name: 'Mohammad Ali',
    rollNumber: '2023003',
    class: 'Class 9A',
    attendance: 85,
    lastAttendance: 'Absent',
    performance: 'Fair',
    contact: '+880 1912345678',
    parent: 'Jamal Ali',
    photoUrl: '',
    tags: ['Attendance Issue'],
  },
  {
    id: 4,
    name: 'Aisha Begum',
    rollNumber: '2023004',
    class: 'Class 9A',
    attendance: 100,
    lastAttendance: 'Present',
    performance: 'Excellent',
    contact: '+880 1612345678',
    parent: 'Karim Begum',
    photoUrl: '',
    tags: ['High Performer'],
  },
  {
    id: 5,
    name: 'Rafiq Islam',
    rollNumber: '2023005',
    class: 'Class 9A',
    attendance: 78,
    lastAttendance: 'Present',
    performance: 'Needs Improvement',
    contact: '+880 1512345678',
    parent: 'Habib Islam',
    photoUrl: '',
    tags: ['Needs Attention', 'Attendance Issue'],
  },
];

// Additional student groups
const studentsByClass = {
  'Class 9A': studentsData,
  'Class 10B': [
    {
      id: 6,
      name: 'Nusrat Jahan',
      rollNumber: '2022001',
      class: 'Class 10B',
      attendance: 95,
      lastAttendance: 'Present',
      performance: 'Good',
      contact: '+880 1712345679',
      parent: 'Jahir Ahmed',
      photoUrl: '',
      tags: [],
    },
    {
      id: 7,
      name: 'Imran Hossain',
      rollNumber: '2022002',
      class: 'Class 10B',
      attendance: 88,
      lastAttendance: 'Present',
      performance: 'Good',
      contact: '+880 1812345679',
      parent: 'Shafiq Hossain',
      photoUrl: '',
      tags: [],
    },
  ],
  'Class 11C': [
    {
      id: 8,
      name: 'Tahmina Akter',
      rollNumber: '2021001',
      class: 'Class 11C',
      attendance: 94,
      lastAttendance: 'Present',
      performance: 'Excellent',
      contact: '+880 1912345679',
      parent: 'Kamrul Akter',
      photoUrl: '',
      tags: ['High Performer'],
    }
  ]
};

const StaffStudentsCard = () => {
  const [activeTab, setActiveTab] = useState('class-9a');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter students based on search term
  const filterStudents = (students: typeof studentsData) => {
    if (!searchTerm) return students;
    return students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get students for the active tab
  const getStudentsForTab = () => {
    if (activeTab === 'class-9a') return filterStudents(studentsByClass['Class 9A'] || []);
    if (activeTab === 'class-10b') return filterStudents(studentsByClass['Class 10B'] || []);
    if (activeTab === 'class-11c') return filterStudents(studentsByClass['Class 11C'] || []);
    return [];
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.4 }
    }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Students</CardTitle>
              <CardDescription>
                Manage students across different classes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Add Student</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students by name or ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Analytics</span>
              </Button>
            </div>
          </div>
          
          {/* Class Tabs */}
          <Tabs defaultValue="class-9a" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="class-9a">Class 9A</TabsTrigger>
              <TabsTrigger value="class-10b">Class 10B</TabsTrigger>
              <TabsTrigger value="class-11c">Class 11C</TabsTrigger>
            </TabsList>
            
            {/* Students List */}
            <TabsContent value={activeTab}>
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {getStudentsForTab().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No students match your search criteria' : 'No students in this class'}
                  </div>
                ) : (
                  getStudentsForTab().map((student) => (
                    <motion.div
                      key={student.id}
                      variants={itemVariants}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border border-gray-200">
                            <AvatarImage src={student.photoUrl} alt={student.name} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {student.name}
                              {student.performance === 'Excellent' && (
                                <Sparkles className="h-4 w-4 text-yellow-500" />
                              )}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
                              <span className="text-gray-300">•</span>
                              <p className="text-sm text-gray-500">{student.class}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {student.tags.map((tag, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline"
                                  className={`
                                    ${tag === 'High Performer' ? 'border-green-500 text-green-700 bg-green-50' : ''}
                                    ${tag === 'Needs Attention' ? 'border-orange-500 text-orange-700 bg-orange-50' : ''}
                                    ${tag === 'Attendance Issue' ? 'border-red-500 text-red-700 bg-red-50' : ''}
                                  `}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2">
                          <div className="flex items-center gap-1 text-sm">
                            <span 
                              className={`inline-block w-2 h-2 rounded-full ${
                                student.lastAttendance === 'Present' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></span>
                            <span className={`
                              ${student.lastAttendance === 'Present' ? 'text-green-600' : 'text-red-600'}
                            `}>
                              {student.lastAttendance}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Attendance: {student.attendance}%
                          </div>
                          <div className="text-sm text-gray-500">
                            Performance: {student.performance}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>View Profile</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <BarChart className="h-4 w-4" />
                          <span>Performance</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <FileDown className="h-4 w-4" />
                          <span>Report</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StaffStudentsCard;
