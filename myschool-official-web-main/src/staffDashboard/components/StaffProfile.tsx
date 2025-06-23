import React, { useState, useEffect } from 'react';
import { getCurrentUser, User, StaffData } from '@/lib/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import ProfileImageUploader from '@/components/ProfileImageUploader';

const StaffProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [staffData, setStaffData] = useState<StaffData>({
    staffId: '',
    nameBangla: '',
    nameEnglish: '',
    subject: '',
    designation: '',
    joiningDate: new Date(),
    nid: '',
    mobile: '',
    salary: 0,
    email: '',
    address: '',
    bloodGroup: '',
    workingDays: 0,
    photoUrl: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const currentUser = await getCurrentUser();
        console.log('Fetched User:', JSON.stringify(currentUser));
        if (currentUser && currentUser.role === 'staff') {
          setUser(currentUser);
          const fetchedStaffData = currentUser.staffData || {};
          setStaffData({
            staffId: fetchedStaffData.staffId || '',
            nameBangla: fetchedStaffData.nameBangla || '',
            nameEnglish: fetchedStaffData.nameEnglish || '',
            subject: fetchedStaffData.subject || '',
            designation: fetchedStaffData.designation || '',
            joiningDate: fetchedStaffData.joiningDate
              ? typeof fetchedStaffData.joiningDate === 'string'
                ? new Date(fetchedStaffData.joiningDate)
                : 'seconds' in fetchedStaffData.joiningDate
                ? new Date(fetchedStaffData.joiningDate.seconds * 1000)
                : new Date(fetchedStaffData.joiningDate)
              : new Date(),
            nid: fetchedStaffData.nid || '',
            mobile: fetchedStaffData.mobile || '',
            salary: fetchedStaffData.salary || 0,
            email: fetchedStaffData.email || currentUser.email || '',
            address: fetchedStaffData.address || '',
            bloodGroup: fetchedStaffData.bloodGroup || '',
            workingDays: fetchedStaffData.workingDays || 0,
            photoUrl: fetchedStaffData.photoUrl || '',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No staff profile found or user is not a staff member.',
          });
        }
      } catch (error: any) {
        console.error('Error fetching user:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to fetch user data.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [toast]);

  // Handle photo upload to ImgBB
  const uploadPhotoToImgBB = async (file: File): Promise<string> => {
    const IMAGE_HOST_KEY = import.meta.env.VITE_IMGBB_API_KEY;
    if (!IMAGE_HOST_KEY) throw new Error('ImgBB API key not configured');

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMAGE_HOST_KEY}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ImgBB upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error('Image upload failed: ' + data.error?.message);

    return data.data.url;
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      setStaffData({ ...staffData, photoUrl: '' });
      setPhotoFile(null);
      return;
    }

    if (!file.type.match('image.*')) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload an image file only.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'Image size must be less than 5MB.' });
      return;
    }

    setPhotoFile(file);
    setIsProcessing(true);

    try {
      const photoUrl = await uploadPhotoToImgBB(file);
      setStaffData({ ...staffData, photoUrl });
      toast({ title: 'Success', description: 'Photo uploaded successfully.' });
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to upload photo.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isProcessing) return;

    setIsProcessing(true);
    try {
      const staffRef = doc(db, 'staff', user.id);
      await setDoc(
        staffRef,
        {
          ...staffData,
          joiningDate: staffData.joiningDate instanceof Date ? staffData.joiningDate : new Date(staffData.joiningDate),
          staffId: user.id, // Ensure staffId matches user.id
        },
        { merge: true }
      );

      // Optionally update the users collection if needed
      const userRef = doc(db, 'users', user.id);
      await setDoc(
        userRef,
        {
          staffData: {
            ...staffData,
            joiningDate: staffData.joiningDate instanceof Date ? staffData.joiningDate : new Date(staffData.joiningDate),
            staffId: user.id,
          },
        },
        { merge: true }
      );

      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update profile.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user || user.role !== 'staff') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No staff profile available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Staff Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2 flex flex-col items-center">
                <ProfileImageUploader
                  currentImageUrl={staffData.photoUrl}
                  onImageChange={handleImageChange}
                  className="mb-4"
                  disabled={true}

                />
              </div>

              {/* <div>
                <Label htmlFor="staffId">Staff ID</Label>
                <Input
                  id="staffId"
                  value={staffData.staffId}
                  onChange={(e) => setStaffData({ ...staffData, staffId: e.target.value })}
                  disabled={true} // staffId should not be editable
                />
              </div> */}
              <div>
                <Label htmlFor="nameBangla">Name (Bangla)</Label>
                <Input
                  id="nameBangla"
                  value={staffData.nameBangla}
                  onChange={(e) => setStaffData({ ...staffData, nameBangla: e.target.value })}
                  disabled={isProcessing}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameEnglish">Name (English)</Label>
                <Input
                  id="nameEnglish"
                  value={staffData.nameEnglish}
                  onChange={(e) => setStaffData({ ...staffData, nameEnglish: e.target.value })}
                  disabled={isProcessing}
                  required
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={staffData.subject}
                  onChange={(e) => setStaffData({ ...staffData, subject: e.target.value })}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={staffData.designation}
                  onChange={(e) => setStaffData({ ...staffData, designation: e.target.value })}
                  // disabled={isProcessing}
                  required
                  disabled={true}
                />
              </div>
              <div>
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={
                    staffData.joiningDate instanceof Date
                      ? staffData.joiningDate.toISOString().split('T')[0]
                      : new Date(staffData.joiningDate).toISOString().split('T')[0]
                  }
                  onChange={(e) => setStaffData({ ...staffData, joiningDate: new Date(e.target.value) })}
                  // disabled={isProcessing}
                  required
                  disabled={true}
                />
              </div>
              <div>
                <Label htmlFor="nid">NID</Label>
                <Input
                  id="nid"
                  value={staffData.nid}
                  onChange={(e) => setStaffData({ ...staffData, nid: e.target.value })}
                  disabled={isProcessing}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={staffData.mobile}
                  onChange={(e) => setStaffData({ ...staffData, mobile: e.target.value })}
                  disabled={isProcessing}
                  required
                />
              </div>
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={staffData.salary}
                  onChange={(e) => setStaffData({ ...staffData, salary: parseFloat(e.target.value) || 0 })}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={staffData.email}
                  onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                  // disabled={isProcessing}
                  required
                  disabled={true}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={staffData.address}
                  onChange={(e) => setStaffData({ ...staffData, address: e.target.value })}
                  disabled={isProcessing}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Input
                  id="bloodGroup"
                  value={staffData.bloodGroup}
                  onChange={(e) => setStaffData({ ...staffData, bloodGroup: e.target.value })}
                  // disabled={isProcessing}
                  disabled={true}
                />
              </div>
              {/* <div>
                <Label htmlFor="workingDays">Working Days</Label>
                <Input
                  id="workingDays"
                  type="number"
                  value={staffData.workingDays}
                  onChange={(e) => setStaffData({ ...staffData, workingDays: parseInt(e.target.value) || 0 })}
                  disabled={isProcessing}
                />
              </div> */}

              <div className="col-span-1 sm:col-span-2 flex justify-end gap-2 mt-4">
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffProfile;