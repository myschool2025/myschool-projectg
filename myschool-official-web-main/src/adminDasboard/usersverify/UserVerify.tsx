import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, editUser, deleteUser } from '@/lib/usersverifyfunctions';
import { User, StudentData, StaffData } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  Trash2Icon,
  PencilIcon,
  SearchIcon,
  CheckCircle2,
  XCircle,
  EyeIcon,
} from 'lucide-react';

// Utility function to convert Firestore date (Timestamp or string) to Date
const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value.seconds && value.nanoseconds) {
    return new Date(value.seconds * 1000);
  }
  if (typeof value === 'string') {
    const parsedDate = new Date(value);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  return null;
};

// Utility function to format date for display
const formatDate = (date: Date | null): string => {
  return date ? date.toLocaleDateString() : 'N/A';
};

// Utility function to format date for input
const formatDateForInput = (date: Date | null): string => {
  return date ? date.toISOString().split('T')[0] : '';
};

interface ExtendedUser extends User {
  verified: boolean;
  staffId?: string;
  designation?: string;
  joiningDate?: any;
  nid?: string;
  photoUrl?: string;
}

const UserVerify: React.FC = () => {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [role, setRole] = useState<'admin' | 'staff' | 'student'>('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'admin' | 'staff' | 'student'
  >('all');
  const [studentData, setStudentData] = useState<StudentData>({
    studentId: '',
    name: '',
    class: '',
    number: '',
    description: '',
    englishName: '',
    motherName: '',
    fatherName: '',
    email: '',
    bloodGroup: '',
    photoUrl: '',
    nameBangla: '',
    nameEnglish: '',
  });
  const [staffData, setStaffData] = useState<StaffData>({
    staffId: '',
    nameBangla: '',
    nameEnglish: '',
    subject: '',
    designation: '',
    joiningDate: '',
    nid: '',
    mobile: '',
    salary: 0,
    email: '',
    address: '',
    bloodGroup: '',
    workingDays: 0,
    photoUrl: '',
  });
  const [adminData, setAdminData] = useState({
    email: '',
    staffId: '',
    designation: '',
    joiningDate: '' as string | '',
    nid: '',
    photoUrl: '',
  });
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      let fetchedUsers: ExtendedUser[] = [];
      if (roleFilter === 'all') {
        const [adminUsers, staffUsers, studentUsers] = await Promise.all([
          getAllUsers('admin'),
          getAllUsers('staff'),
          getAllUsers('student'),
        ]);
        fetchedUsers = [...adminUsers, ...staffUsers, ...studentUsers];
      } else {
        fetchedUsers = await getAllUsers(roleFilter);
      }
      // Normalize dates and sort
      fetchedUsers = fetchedUsers.map((user) => ({
        ...user,
        joiningDate: toDate(user.joiningDate),
        staffData: user.staffData
          ? { ...user.staffData, joiningDate: toDate(user.staffData.joiningDate) }
          : undefined,
        studentData: user.studentData
          ? {
              ...user.studentData,
              nameBangla: user.studentData.nameBangla || user.studentData.name || '',
              nameEnglish:
                user.studentData.nameEnglish || user.studentData.englishName || '',
            }
          : undefined,
      }));
      fetchedUsers.sort((a, b) => {
        const aTime = toDate(a.createdAt)?.getTime() || 0;
        const bTime = toDate(b.createdAt)?.getTime() || 0;
        return bTime - aTime;
      });
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch users',
      });
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users by search term
  useEffect(() => {
    const result = users.filter(
      (user) =>
        (user.studentData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentData?.nameBangla?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentData?.nameEnglish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.staffData?.nameBangla?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.staffData?.nameEnglish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(result);
  }, [searchTerm, users]);

  // Handle edit click
  const handleEditClick = useCallback((user: ExtendedUser) => {
    setSelectedUser(user);
    setRole(user.role);
    setIsVerified(user.verified);

    if (user.role === 'student' && user.studentData) {
      setStudentData({
        studentId: user.studentData.studentId || '',
        name: user.studentData.name || '',
        class: user.studentData.class || '',
        number: user.studentData.number || '',
        description: user.studentData.description || '',
        englishName: user.studentData.englishName || '',
        motherName: user.studentData.motherName || '',
        fatherName: user.studentData.fatherName || '',
        email: user.studentData.email || user.email || '',
        bloodGroup: user.studentData.bloodGroup || '',
        photoUrl: user.studentData.photoUrl || '',
        nameBangla: user.studentData.nameBangla || '',
        nameEnglish: user.studentData.nameEnglish || '',
      });
    } else if (user.role === 'staff' && user.staffData) {
      setStaffData({
        staffId: user.staffData.staffId || '',
        nameBangla: user.staffData.nameBangla || '',
        nameEnglish: user.staffData.nameEnglish || '',
        subject: user.staffData.subject || '',
        designation: user.staffData.designation || '',
        joiningDate: user.staffData.joiningDate || '',
        nid: user.staffData.nid || '',
        mobile: user.staffData.mobile || '',
        salary: user.staffData.salary || 0,
        email: user.staffData.email || user.email || '',
        address: user.staffData.address || '',
        bloodGroup: user.staffData.bloodGroup || '',
        workingDays: user.staffData.workingDays || 0,
        photoUrl: user.staffData.photoUrl || '',
      });
    } else if (user.role === 'admin') {
      setAdminData({
        email: user.email || '',
        staffId: user.staffId || '',
        designation: user.designation || '',
        joiningDate: user.joiningDate ? formatDateForInput(toDate(user.joiningDate)) : '',
        nid: user.nid || '',
        photoUrl: user.photoUrl || '',
      });
    }
    setIsEditModalOpen(true);
  }, []);

  // Handle details click
  const handleDetailsClick = useCallback((user: ExtendedUser) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  }, []);

  // Handle toggle verify
  const handleToggleVerify = useCallback(
    async (user: ExtendedUser) => {
      if (isProcessing[user.id]) return;

      setIsProcessing((prev) => ({ ...prev, [user.id]: true }));
      try {
        await editUser(user.id, { verified: !user.verified });
        toast({
          title: 'Success',
          description: `User has been ${user.verified ? 'unapproved' : 'approved'}.`,
        });
        await fetchUsers();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to update verification status',
        });
      } finally {
        setIsProcessing((prev) => ({ ...prev, [user.id]: false }));
      }
    },
    [fetchUsers, isProcessing, toast]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser || isProcessing[selectedUser.id]) return;

      setIsProcessing((prev) => ({ ...prev, [selectedUser.id]: true }));
      try {
        const updateData: Partial<ExtendedUser> = { role, verified: isVerified };
        if (role === 'student') {
          updateData.studentData = {
            studentId: studentData.studentId || selectedUser.id,
            name: studentData.name || '',
            class: studentData.class || '',
            number: studentData.number || '',
            description: studentData.description || '',
            englishName: studentData.englishName || '',
            motherName: studentData.motherName || '',
            fatherName: studentData.fatherName || '',
            email: studentData.email || selectedUser.email || '',
            bloodGroup: studentData.bloodGroup || '',
            photoUrl: studentData.photoUrl || '',
            nameBangla: studentData.nameBangla || '',
            nameEnglish: studentData.nameEnglish || '',
          };
        } else if (role === 'staff') {
          updateData.staffData = {
            staffId: staffData.staffId || selectedUser.id,
            nameBangla: staffData.nameBangla || '',
            nameEnglish: staffData.nameEnglish || '',
            subject: staffData.subject || '',
            designation: staffData.designation || '',
            joiningDate: staffData.joiningDate || '',
            nid: staffData.nid || '',
            mobile: staffData.mobile || '',
            salary: staffData.salary || 0,
            email: staffData.email || selectedUser.email || '',
            address: staffData.address || '',
            bloodGroup: staffData.bloodGroup || '',
            workingDays: staffData.workingDays || 0,
            photoUrl: staffData.photoUrl || '',
          };
        } else if (role === 'admin') {
          updateData.email = adminData.email || selectedUser.email || '';
          updateData.staffId = adminData.staffId;
          updateData.designation = adminData.designation;
          updateData.joiningDate = adminData.joiningDate ? new Date(adminData.joiningDate) : null;
          updateData.nid = adminData.nid;
          updateData.photoUrl = adminData.photoUrl;
          updateData.staffData = {
            staffId: adminData.staffId || selectedUser.id,
            nameBangla: adminData.email.split('@')[0] || '',
            nameEnglish: adminData.email.split('@')[0] || '',
            subject: '',
            designation: adminData.designation || '',
            joiningDate: adminData.joiningDate || '',
            nid: adminData.nid || '',
            mobile: '',
            salary: 0,
            email: adminData.email || selectedUser.email || '',
            address: '',
            bloodGroup: '',
            workingDays: 0,
            photoUrl: adminData.photoUrl || '',
          };
        }

        await editUser(selectedUser.id, updateData);
        toast({
          title: 'Success',
          description: `User data updated successfully.`,
        });
        await fetchUsers();
        setIsEditModalOpen(false);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to update user',
        });
      } finally {
        setIsProcessing((prev) => ({ ...prev, [selectedUser.id]: false }));
      }
    },
    [
      selectedUser,
      isProcessing,
      role,
      isVerified,
      studentData,
      staffData,
      adminData,
      fetchUsers,
      toast,
    ]
  );

  // Handle delete user
  const handleDelete = useCallback(
    async (userId: string, role: 'admin' | 'staff' | 'student') => {
      if (isProcessing[userId] || !window.confirm(`Are you sure you want to delete this user?`))
        return;

      setIsProcessing((prev) => ({ ...prev, [userId]: true }));
      try {
        await deleteUser(userId);
        toast({
          title: 'Success',
          description: `User deleted successfully.`,
        });
        await fetchUsers();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to delete user',
        });
      } finally {
        setIsProcessing((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [fetchUsers, isProcessing, toast]
  );

  // Memoized filtered users for performance
  const memoizedFilteredUsers = useMemo(() => filteredUsers, [filteredUsers]);

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        {/* Header with Filters */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <SearchIcon
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                disabled={isLoading}
                aria-label="Search users"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value: 'all' | 'admin' | 'staff' | 'student') =>
                setRoleFilter(value)
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter by role">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" aria-label="Loading users" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Photo</TableHead>
                  <TableHead className="text-left">Name</TableHead>
                  <TableHead className="text-left">Email</TableHead>
                  <TableHead className="text-left">Role</TableHead>
                  <TableHead className="text-left">Verified</TableHead>
                  <TableHead className="text-left">Role-Specific Info</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memoizedFilteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  memoizedFilteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.studentData?.photoUrl || user.staffData?.photoUrl || user.photoUrl ? (
                          <img
                            src={
                              user.studentData?.photoUrl ||
                              user.staffData?.photoUrl ||
                              user.photoUrl ||
                              ''
                            }
                            alt="User"
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.studentData?.name ||
                          user.studentData?.nameEnglish ||
                          user.staffData?.nameEnglish ||
                          'Unknown'}
                      </TableCell>
                      <TableCell>
                        {user.email || user.studentData?.email || user.staffData?.email || 'N/A'}
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {user.verified ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" aria-label="Verified" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" aria-label="Not verified" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role === 'student' && user.studentData ? (
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="font-medium">Student ID:</span>{' '}
                              {user.studentData.studentId || 'N/A'}
                            </p>
                            <p>
                              <span className="font-medium">Class:</span>{' '}
                              {user.studentData.class || 'N/A'}
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleDetailsClick(user)}
                              className="p-0"
                            >
                              View Details
                            </Button>
                          </div>
                        ) : (user.role === 'staff' || user.role === 'admin') &&
                          user.staffData ? (
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="font-medium">Staff ID:</span>{' '}
                              {user.staffData.staffId || 'N/A'}
                            </p>
                            <p>
                              <span className="font-medium">Designation:</span>{' '}
                              {user.staffData.designation || 'N/A'}
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleDetailsClick(user)}
                              className="p-0"
                            >
                              View Details
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-500">No role-specific data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            // disabled={isProcessing[user.id]}
                            aria-label={`Edit user`}
                            disabled={true}
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant={user.verified ? 'secondary' : 'default'}
                            size="sm"
                            onClick={() => handleToggleVerify(user)}
                            disabled={isProcessing[user.id]}
                            aria-label={user.verified ? 'Unapprove' : 'Approve'}
                          >
                            {isProcessing[user.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.verified ? (
                              <XCircle className="h-4 w-4 mr-1" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                            )}
                            {user.verified ? 'Unapprove' : 'Approve'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.id, user.role)}
                            disabled={isProcessing[user.id]}
                            aria-label={`Delete user`}
                          >
                            {isProcessing[user.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2Icon className="h-4 w-4 mr-1" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                User Details
              </DialogTitle>
            </DialogHeader>
            {selectedUser?.role === 'student' && selectedUser.studentData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Student ID</Label>
                  <p>{selectedUser.studentData.studentId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Name</Label>
                  <p>{selectedUser.studentData.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Name (Bangla)</Label>
                  <p>{selectedUser.studentData.nameBangla || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Name (English)</Label>
                  <p>{selectedUser.studentData.nameEnglish || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Class</Label>
                  <p>{selectedUser.studentData.class || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Number</Label>
                  <p>{selectedUser.studentData.number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Description</Label>
                  <p>{selectedUser.studentData.description || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">English Name</Label>
                  <p>{selectedUser.studentData.englishName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Mother’s Name</Label>
                  <p>{selectedUser.studentData.motherName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Father’s Name</Label>
                  <p>{selectedUser.studentData.fatherName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{selectedUser.studentData.email || selectedUser.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Blood Group</Label>
                  <p>{selectedUser.studentData.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Photo URL</Label>
                  <p>{selectedUser.studentData.photoUrl || 'N/A'}</p>
                </div>
              </div>
            ) : (selectedUser?.role === 'staff' || selectedUser?.role === 'admin') &&
              selectedUser.staffData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Staff ID</Label>
                  <p>{selectedUser.staffData.staffId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Name (Bangla)</Label>
                  <p>{selectedUser.staffData.nameBangla || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Name (English)</Label>
                  <p>{selectedUser.staffData.nameEnglish || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Subject</Label>
                  <p>{selectedUser.staffData.subject || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Designation</Label>
                  <p>{selectedUser.staffData.designation || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Joining Date</Label>
                  <p>{formatDate(toDate(selectedUser.staffData.joiningDate))}</p>
                </div>
                <div>
                  <Label className="font-medium">NID</Label>
                  <p>{selectedUser.staffData.nid || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Mobile</Label>
                  <p>{selectedUser.staffData.mobile || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Salary</Label>
                  <p>{selectedUser.staffData.salary || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{selectedUser.staffData.email || selectedUser.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Address</Label>
                  <p>{selectedUser.staffData.address || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Blood Group</Label>
                  <p>{selectedUser.staffData.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Working Days</Label>
                  <p>{selectedUser.staffData.workingDays || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Photo URL</Label>
                  <p>{selectedUser.staffData.photoUrl || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p>No role-specific data available.</p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value: 'admin' | 'staff' | 'student') => setRole(value)}
                  disabled={isProcessing[selectedUser?.id || '']}
                >
                  <SelectTrigger aria-label="Select role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="verified">Verification Status</Label>
                <Select
                  value={isVerified ? 'verified' : 'unverified'}
                  onValueChange={(value) => setIsVerified(value === 'verified')}
                  disabled={isProcessing[selectedUser?.id || '']}
                >
                  <SelectTrigger aria-label="Select verification status">
                    <SelectValue placeholder="Select verification status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'student' && (
                <>
                  <div>
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={studentData.studentId}
                      onChange={(e) =>
                        setStudentData({ ...studentData, studentId: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={studentData.name}
                      onChange={(e) =>
                        setStudentData({ ...studentData, name: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameBangla">Name (Bangla)</Label>
                    <Input
                      id="nameBangla"
                      value={studentData.nameBangla}
                      onChange={(e) =>
                        setStudentData({ ...studentData, nameBangla: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameEnglish">Name (English)</Label>
                    <Input
                      id="nameEnglish"
                      value={studentData.nameEnglish}
                      onChange={(e) =>
                        setStudentData({ ...studentData, nameEnglish: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Input
                      id="class"
                      value={studentData.class}
                      onChange={(e) =>
                        setStudentData({ ...studentData, class: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Number</Label>
                    <Input
                      id="number"
                      value={studentData.number}
                      onChange={(e) =>
                        setStudentData({ ...studentData, number: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={studentData.description || ''}
                      onChange={(e) =>
                        setStudentData({ ...studentData, description: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="englishName">English Name (Alternative)</Label>
                    <Input
                      id="englishName"
                      value={studentData.englishName || ''}
                      onChange={(e) =>
                        setStudentData({ ...studentData, englishName: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="motherName">Mother’s Name</Label>
                    <Input
                      id="motherName"
                      value={studentData.motherName || ''}
                      onChange={(e) =>
                        setStudentData({ ...studentData, motherName: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fatherName">Father’s Name</Label>
                    <Input
                      id="fatherName"
                      value={studentData.fatherName || ''}
                      onChange={(e) =>
                        setStudentData({ ...studentData, fatherName: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={studentData.email}
                      onChange={(e) =>
                        setStudentData({ ...studentData, email: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Input
                      id="bloodGroup"
                      value={studentData.bloodGroup || ''}
                      onChange={(e) =>
                        setStudentData({ ...studentData, bloodGroup: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="photoUrl">Photo URL</Label>
                    <Input
                      id="photoUrl"
                      value={studentData.photoUrl || ''}
                      onChange={(e) =>
                        setStudentData({ ...studentData, photoUrl: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                </>
              )}

              {role === 'staff' && (
                <>
                  <div>
                    <Label htmlFor="staffId">Staff ID</Label>
                    <Input
                      id="staffId"
                      value={staffData.staffId}
                      onChange={(e) =>
                        setStaffData({ ...staffData, staffId: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameBangla">Name (Bangla)</Label>
                    <Input
                      id="nameBangla"
                      value={staffData.nameBangla}
                      onChange={(e) =>
                        setStaffData({ ...staffData, nameBangla: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameEnglish">Name (English)</Label>
                    <Input
                      id="nameEnglish"
                      value={staffData.nameEnglish}
                      onChange={(e) =>
                        setStaffData({ ...staffData, nameEnglish: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={staffData.subject}
                      onChange={(e) =>
                        setStaffData({ ...staffData, subject: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={staffData.designation}
                      onChange={(e) =>
                        setStaffData({ ...staffData, designation: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={staffData.joiningDate}
                      onChange={(e) =>
                        setStaffData({ ...staffData, joiningDate: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nid">NID</Label>
                    <Input
                      id="nid"
                      value={staffData.nid}
                      onChange={(e) =>
                        setStaffData({ ...staffData, nid: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      value={staffData.mobile}
                      onChange={(e) =>
                        setStaffData({ ...staffData, mobile: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary">Salary</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={staffData.salary}
                      onChange={(e) =>
                        setStaffData({ ...staffData, salary: Number(e.target.value) })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={staffData.email}
                      onChange={(e) =>
                        setStaffData({ ...staffData, email: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={staffData.address}
                      onChange={(e) =>
                        setStaffData({ ...staffData, address: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Input
                      id="bloodGroup"
                      value={staffData.bloodGroup || ''}
                      onChange={(e) =>
                        setStaffData({ ...staffData, bloodGroup: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workingDays">Working Days</Label>
                    <Input
                      id="workingDays"
                      type="number"
                      value={staffData.workingDays}
                      onChange={(e) =>
                        setStaffData({
                          ...staffData,
                          workingDays: Number(e.target.value),
                        })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="photoUrl">Photo URL</Label>
                    <Input
                      id="photoUrl"
                      value={staffData.photoUrl || ''}
                      onChange={(e) =>
                        setStaffData({ ...staffData, photoUrl: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                </>
              )}

              {role === 'admin' && (
                <>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={adminData.email}
                      onChange={(e) =>
                        setAdminData({ ...adminData, email: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="staffId">Staff ID</Label>
                    <Input
                      id="staffId"
                      value={adminData.staffId}
                      onChange={(e) =>
                        setAdminData({ ...adminData, staffId: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={adminData.designation}
                      onChange={(e) =>
                        setAdminData({ ...adminData, designation: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={adminData.joiningDate}
                      onChange={(e) =>
                        setAdminData({ ...adminData, joiningDate: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nid">NID</Label>
                    <Input
                      id="nid"
                      value={adminData.nid}
                      onChange={(e) =>
                        setAdminData({ ...adminData, nid: e.target.value })
                      }
                      required
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                  <div>
                    <Label htmlFor="photoUrl">Photo URL</Label>
                    <Input
                      id="photoUrl"
                      value={adminData.photoUrl || ''}
                      onChange={(e) =>
                        setAdminData({ ...adminData, photoUrl: e.target.value })
                      }
                      disabled={isProcessing[selectedUser?.id || '']}
                    />
                  </div>
                </>
              )}

              <DialogFooter className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2 mt-4">
                <Button
                  type="submit"
                  disabled={isProcessing[selectedUser?.id || '']}
                  className="w-full sm:w-auto"
                >
                  {isProcessing[selectedUser?.id || ''] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update User'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isProcessing[selectedUser?.id || '']}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserVerify;