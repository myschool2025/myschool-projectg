import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Pie, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Toaster } from '../../components/ui/sonner';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Users, BookOpen, Wallet, AlertCircle, Clock, Coins, LineChart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Loading from '@/components/loader/Loading';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface TeacherStats {
  subjectDistribution: { [key: string]: number };
  totalSalary: number;
  designationDistribution: { [key: string]: number };
  totalStaff: number;
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({
    subjectDistribution: {},
    totalSalary: 0,
    designationDistribution: {},
    totalStaff: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([loadStats(), loadTeacherStats()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin-overview`);
      if (!response.ok) throw new Error(`Failed to fetch admin overview: ${response.statusText}`);
      const { overview } = await response.json();
      setStats(overview || {});
    } catch (err) {
      setError('Failed to load statistics');
      toast.error('Connection error. Please try again.');
    }
  };

  const loadTeacherStats = async () => {
    try {
      const staffRef = collection(db, 'staff');
      const querySnapshot = await getDocs(staffRef);

      const subjectDistribution: { [key: string]: number } = {};
      const designationDistribution: { [key: string]: number } = {};
      let totalSalary = 0;
      let totalStaff = 0;

      console.log('Total staff documents:', querySnapshot.size);

      querySnapshot.forEach((doc) => {
        const staffData = doc.data();
        console.log('Staff data:', staffData);

        // Count total staff
        totalStaff++;

        // Process subject distribution - only for academic staff
        const isAcademicStaff = [
          'Teacher',
          'Assistant Teacher',
          'Vice Principal',
          'Principal'
        ].includes(staffData.designation);

        if (isAcademicStaff && staffData.subject) {
          const subject = staffData.subject.trim();
          if (subject) {
            subjectDistribution[subject] = (subjectDistribution[subject] || 0) + 1;
          }
        }

        // Process designation and salary
        if (staffData.designation) {
          designationDistribution[staffData.designation] = (designationDistribution[staffData.designation] || 0) + 1;
        }
        if (staffData.salary) {
          totalSalary += Number(staffData.salary);
        }
      });

      console.log('Final staff stats:', {
        totalStaff,
        subjectDistribution,
        totalSalary,
        designationDistribution
      });

      setTeacherStats({
        subjectDistribution,
        totalSalary,
        designationDistribution,
        totalStaff
      });

    } catch (err) {
      console.error('Error loading staff stats:', err);
      toast.error('Failed to load staff statistics');
    }
  };

  const chartColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="bg-red-100 p-4 rounded-full">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">{error}</h2>
        <Button onClick={() => loadStats()} className="gap-2">
          <Clock className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  // Data processing for charts
  const classDistributionData = Object.entries(stats?.students?.classDistribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  const subjectDistributionData = Object.entries(teacherStats.subjectDistribution).map(([name, value]) => ({
    name,
    value: value as number
  }));

  const financialData = [
    { name: 'Income', value: stats?.transactions?.totalIncome || 0 },
    { name: 'Expenses', value: stats?.transactions?.totalExpenses || 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={stats?.students?.totalStudents || 0}
            icon={<Users className="h-6 w-6" />}
            trend="up"
            percentage="12%"
          />
          <StatCard
            title="Total Staff"
            value={teacherStats.totalStaff || 0}
            icon={<BookOpen className="h-6 w-6" />}
            trend="stable"
          />
          <StatCard
            title="Net Balance"
            value={`৳${(stats?.transactions?.netBalance || 0).toFixed(2)}`}
            icon={<Wallet className="h-6 w-6" />}
            trend={stats?.transactions?.netBalance >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Incomplete Profiles"
            value={stats?.students?.incompleteProfiles || 0}
            icon={<AlertCircle className="h-6 w-6" />}
            trend="down"
            percentage="5%"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <LineChart className="h-5 w-5" /> Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {financialData.map((_, index) => (
                        <Cell key={index} fill={index === 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" /> Class Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {classDistributionData.map((_, index) => (
                        <Cell key={index} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <BookOpen className="h-5 w-5" /> Academic Subject Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 pr-4">
                {Object.keys(teacherStats.subjectDistribution).length > 0 ? (
                  subjectDistributionData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index] }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Badge variant="outline" className="px-3 py-1">
                        {item.value}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    No academic subject distribution data available
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Coins className="h-5 w-5" /> Salary Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Monthly Salary</span>
              <span className="font-semibold text-emerald-600">
                ৳{teacherStats.totalSalary.toFixed(2)}
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Designation Distribution</h4>
              {Object.entries(teacherStats.designationDistribution).map(([designation, count]) => (
                <div key={designation} className="flex items-center justify-between">
                  <span className="text-gray-600">{designation}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <AlertCircle className="h-5 w-5" /> Data Quality Report
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Profile Completion</span>
                <span className="font-semibold">
                  {Math.round(
                    ((stats.students.totalStudents - stats.students.incompleteProfiles) /
                      stats.students.totalStudents) *
                    100
                  ) || 0}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${((stats.students.totalStudents - stats.students.incompleteProfiles) /
                      stats.students.totalStudents) *
                      100}%`
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Unique Parent Accounts</span>
                <span className="font-semibold">{stats.students.uniqueParents}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${(stats.students.uniqueParents / stats.students.totalStudents) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Last Updated</span>
                <span className="font-medium text-sm">
                  {new Date(stats.lastUpdated).toLocaleDateString()}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Total Transactions</span>
                <span className="font-semibold">{stats.transactions.totalTransactions}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{
                    width: `${Math.min(
                      (stats.transactions.totalTransactions / 1000) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  percentage?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, percentage }) => (
  <Card className="group hover:border-gray-300 transition-colors">
    <CardContent className="p-6 flex items-center justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-500">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
      {trend && (
        <div className={`p-2 rounded-full ${trend === 'up' ? 'bg-emerald-100' : trend === 'down' ? 'bg-red-100' : 'bg-gray-100'}`}>
          {trend === 'up' ? (
            <ArrowUp className="h-5 w-5 text-emerald-600" />
          ) : trend === 'down' ? (
            <ArrowDown className="h-5 w-5 text-red-600" />
          ) : (
            <div className="h-5 w-5 bg-gray-400 rounded-full" />
          )}
        </div>
      )}
    </CardContent>
    {percentage && (
      <CardFooter className="px-6 pb-4 pt-0">
        <span className={`text-sm ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
          {percentage} from last month
        </span>
      </CardFooter>
    )}
  </Card>
);

export default AdminOverview;