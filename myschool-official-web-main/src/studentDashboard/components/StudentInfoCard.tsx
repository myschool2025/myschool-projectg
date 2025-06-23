import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Mail, Phone } from "lucide-react";
import { getCurrentUser } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, StudentData } from '@/lib/types';

const StudentInfoCard = () => {
  const [studentInfo, setStudentInfo] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role === 'student' && user.studentData) {
          setStudentInfo(user.studentData);
        } else {
          // Create a default student record if none exists
          setStudentInfo({
            studentId: user?.id || '',
            name: '',
            englishName: '',
            class: '',
            number: '',
            email: user?.email || '',
            motherName: '',
            fatherName: '',
            bloodGroup: '',
            photoUrl: '',
            description: ''
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching student info:", error);
        setLoading(false);
      }
    };

    fetchStudentInfo();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-lg">
        <CardContent className="p-6 flex justify-center items-center h-64">
          <div className="animate-pulse w-full space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="rounded-full bg-gray-200 h-16 w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!studentInfo) {
    return (
      <Card className="border border-gray-200 shadow-lg">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No student information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border border-gray-200 shadow-lg overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <CardTitle className="text-white flex justify-between items-center">
            <span>Student Profile</span>

          </CardTitle>
          <CardDescription className="text-blue-100">
            Student ID: {studentInfo.studentId.substring(0, 8)}...
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={studentInfo.photoUrl} alt={studentInfo.name} />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                  {studentInfo.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-xl text-center">{studentInfo.name}</h3>
              <p className="text-sm text-gray-500">{studentInfo.englishName}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                <span>{studentInfo.email}</span>
              </div>
              {studentInfo.number && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="h-4 w-4" />
                  <span>{studentInfo.number}</span>
                </div>
              )}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Class</h4>
                <p className="text-base">{studentInfo.class}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Blood Group</h4>
                <p className="text-base">{studentInfo.bloodGroup}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Mother's Name</h4>
                <p className="text-base">{studentInfo.motherName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Father's Name</h4>
                <p className="text-base">{studentInfo.fatherName}</p>
              </div>
              {studentInfo.description && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="text-base">{studentInfo.description}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StudentInfoCard;
