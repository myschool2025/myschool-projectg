
import React from 'react';
import { motion } from 'framer-motion';
import StudentInfoCard from './components/StudentInfoCard';
import StudentAttendanceCard from './components/StudentAttendanceCard';
import StudentResourcesCard from './components/StudentResourcesCard';

const StudentDashboard: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      className="p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      

      {/* Student Info Card */}
      <StudentInfoCard />

      {/* Student Attendance Card */}
      <StudentAttendanceCard />

      {/* Student Resources Card */}
      <StudentResourcesCard />
    </motion.div>
  );
};

export default StudentDashboard;
