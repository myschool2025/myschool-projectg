import React, { useState, useEffect } from 'react';
import { getCurrentUser, User, StudentData } from '@/lib/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import ProfileImageUploader from '@/components/ProfileImageUploader';

const StudentProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<StudentData>({
    studentId: '',
    name: '',
    englishName: '',
    class: '',
    number: '',
    description: '',
    motherName: '',
    fatherName: '',
    email: '',
    bloodGroup: '',
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
        if (currentUser && currentUser.role === 'student') {
          setUser(currentUser);
          const fetchedStudentData = currentUser.studentData || {};
          setStudentData({
            studentId: fetchedStudentData.studentId || currentUser.id || '',
            name: fetchedStudentData.name || '',
            englishName: fetchedStudentData.englishName || '',
            class: fetchedStudentData.class || '',
            number: fetchedStudentData.number || '',
            description: fetchedStudentData.description || '',
            motherName: fetchedStudentData.motherName || '',
            fatherName: fetchedStudentData.fatherName || '',
            email: fetchedStudentData.email || currentUser.email || '',
            bloodGroup: fetchedStudentData.bloodGroup || '',
            photoUrl: fetchedStudentData.photoUrl || '',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No student profile found or user is not a student.',
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
        Accept: 'application/json',
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
      setStudentData({ ...studentData, photoUrl: '' });
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
      setStudentData({ ...studentData, photoUrl });
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
      // Validate required fields
      if (!studentData.name || !studentData.class || !studentData.number || !studentData.email) {
        throw new Error('Name, class, number, and email are required');
      }

      const studentRef = doc(db, 'students', user.id);
      await setDoc(
        studentRef,
        {
          ...studentData,
          studentId: user.id,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">No student profile available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="bg-blue-50 border-b border-blue-100">
          <CardTitle className="text-3xl font-semibold text-blue-800">My Profile</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <ProfileImageUploader
                currentImageUrl={studentData.photoUrl}
                onImageChange={handleImageChange}
                disabled={true}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name (Bangla)
                </Label>
                <Input
                  id="name"
                  value={studentData.name}
                  onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                  disabled={isProcessing}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="englishName" className="text-sm font-medium text-gray-700">
                  Name (English)
                </Label>
                <Input
                  id="englishName"
                  value={studentData.englishName}
                  onChange={(e) => setStudentData({ ...studentData, englishName: e.target.value })}
                  disabled={isProcessing}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class" className="text-sm font-medium text-gray-700">
                  Class
                </Label>
                <Input
                  id="class"
                  value={studentData.class}
                  onChange={(e) => setStudentData({ ...studentData, class: e.target.value })}
                  // disabled={isProcessing}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="number"
                  value={studentData.number}
                  onChange={(e) => setStudentData({ ...studentData, number: e.target.value })}
                  disabled={isProcessing}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={studentData.email}
                  required
                  className="border-gray-300 bg-gray-100 cursor-not-allowed"
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGroup" className="text-sm font-medium text-gray-700">
                  Blood Group
                </Label>
                <Input
                  id="bloodGroup"
                  value={studentData.bloodGroup}
                  onChange={(e) => setStudentData({ ...studentData, bloodGroup: e.target.value })}
                  disabled={isProcessing}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherName" className="text-sm font-medium text-gray-700">
                  Mother's Name
                </Label>
                <Input
                  id="motherName"
                  value={studentData.motherName}
                  onChange={(e) => setStudentData({ ...studentData, motherName: e.target.value })}
                  disabled={isProcessing}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatherName" className="text-sm font-medium text-gray-700">
                  Father's Name
                </Label>
                <Input
                  id="fatherName"
                  value={studentData.fatherName}
                  onChange={(e) => setStudentData({ ...studentData, fatherName: e.target.value })}
                  disabled={isProcessing}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {/* <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Input
                  id="description"
                  value={studentData.description}
                  onChange={(e) => setStudentData({ ...studentData, description: e.target.value })}
                  disabled={isProcessing}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div> */}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="submit"
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
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
  );
};

export default StudentProfile;