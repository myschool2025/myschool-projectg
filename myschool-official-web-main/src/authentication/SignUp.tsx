import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookIcon, BriefcaseIcon, UploadIcon, LockIcon, MailIcon, EyeIcon, EyeOffIcon, Loader2, X } from 'lucide-react';
import { z } from 'zod';
import classesData from '@/lib/classes.json';

// Define constants for dropdown options
const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);
const SUBJECT_OPTIONS = ["বাংলা", "ইংরেজি", "আরবি", "গণিত", "বিজ্ঞান", "সমাজ ও বিশ্ব পরিচয়"];
const BLOOD_GROUP_OPTIONS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];
const DESIGNATION_OPTIONS = [
  "Teacher", "Assistant Teacher", "Vice Principal", "Principal", "Administrative Vice Principal",
  "Cleaner", "Manager", "Assistant Manager", "IT Head", "Security Guard", "Accounts Head",
  "Assistant Accounts", "Academic Principal", "Academic Vice Principal",
];

// Updated Zod schemas with all fields required
const studentSchema = z.object({
  name: z.string()
    .min(1, "Please enter your Bangla name")
    .regex(/^[\u0980-\u09FF\s]+$/, "Name must contain only Bangla characters"),
  class: z.string().min(1, "Please select your class"),
  number: z.string()
    .min(1, "Please enter your phone number")
    .regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number (e.g., +8801XXXXXXXXX or 01XXXXXXXXX)"),
  email: z.string().email("Please enter a valid email address"),
  photoUrl: z.string().url("Please upload a valid profile photo"),
  motherName: z.string().min(1, "Please enter mother's name"),
  fatherName: z.string().min(1, "Please enter father's name"),
  bloodGroup: z.string().min(1, "Please select your blood group"),
  description: z.string().optional(),
  englishName: z.string()
    .min(1, "Please enter your English name")
    .regex(/^[A-Za-z\s]+$/, "English name must contain only English letters"),
});

const staffSchema = z.object({
  nameBangla: z.string()
    .min(1, "Please enter your name in Bangla")
    .regex(/^[\u0980-\u09FF\s]+$/, "Name must contain only Bangla characters")
    .optional(),
  nameEnglish: z.string()
    .min(1, "Please enter your name in English")
    .regex(/^[A-Za-z\s]+$/, "English name must contain only English letters")
    .optional(),
  designation: z.string().min(1, "Please select your designation").optional(),
  joiningDate: z.string().min(1, "Please select your joining date").optional(),
  nid: z.string().min(1, "Please enter your NID number").optional(),
  mobile: z.string()
    .min(1, "Please enter your mobile number")
    .regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number (e.g., +8801XXXXXXXXX or 01XXXXXXXXX)")
    .optional(),
  address: z.string().min(1, "Please enter your address").optional(),
  photoUrl: z.string().url("Please upload a valid profile photo").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  subject: z.string().min(1, "Please select a subject").optional(),
  salary: z.number().nonnegative("Salary cannot be negative").optional(),
  bloodGroup: z.string().min(1, "Please select your blood group").optional(),
  workingDays: z.number().optional(),
});

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'staff' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [operationStatus, setOperationStatus] = useState<'idle' | 'uploading'>('idle');

  // Common fields for both roles
  const [nameBangla, setNameBangla] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');

  // Student fields
  const [name, setName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [className, setClassName] = useState('');
  const [number, setNumber] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [studentBloodGroup, setStudentBloodGroup] = useState('');
  const [description, setDescription] = useState('');

  // Staff fields
  const [subject, setSubject] = useState('');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [nid, setNid] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [staffBloodGroup, setStaffBloodGroup] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [workingDays, setWorkingDays] = useState<number | ''>('');

  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Validate individual field
  const validateField = (name: string, value: any, schema: z.ZodTypeAny) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      setErrors(prev => ({ ...prev, [name]: result.error.errors[0].message }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate entire form
  const validateForm = () => {
    if (!role) return false;

    const commonData = {
      email,
      password,
      confirmPassword,
      photoUrl,
    };

    const studentData = role === 'student' ? {
      name,
      class: className,
      number,
      email,
      photoUrl,
      motherName,
      fatherName,
      bloodGroup: studentBloodGroup,
      description,
      englishName,
    } : null;

    const staffData = role === 'staff' ? {
      nameBangla,
      nameEnglish,
      designation,
      joiningDate,
      nid,
      mobile,
      address,
      photoUrl,
      email,
      subject,
      salary: Number(salary),
      bloodGroup: staffBloodGroup,
      workingDays: Number(workingDays),
    } : null;

    // Validate common fields
    const emailValid = z.string().email().safeParse(email).success;
    const passwordValid = passwordSchema.safeParse(password).success;
    const passwordsMatch = password === confirmPassword;
    const photoValid = z.string().url().safeParse(photoUrl).success;

    // Validate role-specific data
    const roleSchema = role === 'student' ? studentSchema : staffSchema;
    const roleData = role === 'student' ? studentData : staffData;
    const roleValid = roleData ? roleSchema.safeParse(roleData).success : false;

    return emailValid && passwordValid && passwordsMatch && photoValid && roleValid;
  };

  // Update form validity and validate fields
  useEffect(() => {
    setIsFormValid(validateForm());

    // Common fields
    if (email) validateField('email', email, z.string().email());
    if (password) validateField('password', password, passwordSchema);
    if (confirmPassword && password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords don't match" }));
    } else if (confirmPassword) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
    if (photoUrl) {
      validateField('photoUrl', photoUrl, z.string().url());
    } else {
      setErrors(prev => ({ ...prev, photoUrl: "Please upload a profile photo" }));
    }

    // Role-specific fields
    if (role === 'student') {
      if (name) validateField('name', name, studentSchema.shape.name);
      if (englishName) validateField('englishName', englishName, studentSchema.shape.englishName);
      if (className) validateField('class', className, studentSchema.shape.class);
      if (number) validateField('number', number, studentSchema.shape.number);
      if (motherName) validateField('motherName', motherName, studentSchema.shape.motherName);
      if (fatherName) validateField('fatherName', fatherName, studentSchema.shape.fatherName);
      if (studentBloodGroup) validateField('bloodGroup', studentBloodGroup, studentSchema.shape.bloodGroup);
      // if (description) validateField('description', description, studentSchema.shape.description);
    } else if (role === 'staff') {
      if (nameBangla) validateField('nameBangla', nameBangla, staffSchema.shape.nameBangla);
      if (nameEnglish) validateField('nameEnglish', nameEnglish, staffSchema.shape.nameEnglish);
      if (designation) validateField('designation', designation, staffSchema.shape.designation);
      if (joiningDate) validateField('joiningDate', joiningDate, staffSchema.shape.joiningDate);
      if (nid) validateField('nid', nid, staffSchema.shape.nid);
      if (mobile) validateField('mobile', mobile, staffSchema.shape.mobile);
      if (address) validateField('address', address, staffSchema.shape.address);
      if (staffBloodGroup) validateField('bloodGroup', staffBloodGroup, staffSchema.shape.bloodGroup);
      if (subject) validateField('subject', subject, staffSchema.shape.subject);
      if (salary !== '') validateField('salary', Number(salary), staffSchema.shape.salary);
      // if (workingDays !== '') validateField('workingDays', Number(workingDays), staffSchema.shape.workingDays);
    }
  }, [
    email, password, confirmPassword, role, photoUrl,
    name, englishName, className, number, motherName, fatherName, studentBloodGroup,
    nameBangla, nameEnglish, designation, joiningDate, nid, mobile, address, staffBloodGroup, salary, subject
  ]);

  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const IMAGE_HOST_KEY = import.meta.env.VITE_IMGBB_API_KEY;
    if (!IMAGE_HOST_KEY) throw new Error('ImgBB API key not configured');

    const formData = new FormData();
    formData.append('image', file);

    setOperationStatus('uploading');
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMAGE_HOST_KEY}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Error uploading image to ImgBB');
      const data = await response.json();
      return data.data.url;
    } catch (error) {
      throw error;
    } finally {
      setOperationStatus('idle');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      toast({ variant: "destructive", title: "Error", description: "Please upload an image file only." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Error", description: "Image size must be less than 5MB." });
      return;
    }

    setSelectedImage(file);
    setIsLoading(true);

    try {
      const uploadedUrl = await uploadImageToImgBB(file);
      setPhotoUrl(uploadedUrl);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload image to ImgBB",
      });
      console.error('ImgBB upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPhotoUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      if (role === "student") {
        const studentData = {
          name,
          class: className,
          number,
          email,
          photoUrl,
          motherName,
          fatherName,
          bloodGroup: studentBloodGroup,
          description,
          englishName,
        };
        await register(email, password, role, { studentData });
      } else {
        const staffData = {
          nameBangla,
          nameEnglish,
          designation,
          joiningDate,
          nid,
          mobile,
          address,
          photoUrl,
          email,
          subject,
          salary: Number(salary),
          bloodGroup: staffBloodGroup,
          workingDays: Number(workingDays),
        };
        await register(email, password, role, { staffData });
      }
      toast({
        title: "Registration successful!",
        description: "Your account is pending verification. Please contact the admin for approval.",
      });
      navigate("/pending-verification");
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Something went wrong. Please try again.";
      if (error.message.includes("email-already-in-use")) {
        errorMessage = "This email is already registered. Please use a different email or log in.";
      }
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-school-light to-white p-4">
        <div className="max-w-md w-full space-y-4">
          <h2 className="text-3xl font-bold text-center text-school-primary">Join Our School</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setRole('student')}
              className="p-8 border-2 rounded-xl hover:border-school-primary transition-all flex flex-col items-center"
              disabled={isLoading}
            >
              <BookIcon className="h-12 w-12 mb-4 text-school-primary" />
              <h3 className="text-xl font-semibold">Student</h3>
              <p className="text-muted-foreground">Create student account</p>
            </button>
            <button
              onClick={() => setRole('staff')}
              className="p-8 border-2 rounded-xl hover:border-school-primary transition-all flex flex-col items-center"
              disabled={isLoading}
            >
              <BriefcaseIcon className="h-12 w-12 mb-4 text-school-primary" />
              <h3 className="text-xl font-semibold">Staff</h3>
              <p className="text-muted-foreground">Create staff account</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-school-light to-white p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-school-primary">
            {role === 'student' ? 'Student Registration' : 'Staff Registration'}
          </CardTitle>
          <CardDescription>
            <button
              onClick={() => setRole(null)}
              className="text-school-primary hover:underline"
              disabled={isLoading}
            >
              ← Change role
            </button>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="email"><MailIcon className="inline h-4 w-4 mr-2" /> Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password"><LockIcon className="inline h-4 w-4 mr-2" /> Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword"><LockIcon className="inline h-4 w-4 mr-2" /> Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="photo-upload"><UploadIcon className="inline h-4 w-4 mr-2" /> Profile Photo *</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {photoUrl ? (
                    <>
                      <img
                        src={photoUrl}
                        alt="Profile Preview"
                        className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg border border-red-500">
                      <span className="text-gray-400 text-sm">No photo</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`px-4 py-2 rounded-lg text-center text-sm cursor-pointer transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {operationStatus === 'uploading' ? 'Uploading...' : 'Upload Photo'}
                  </label>
                  <span className="text-xs text-gray-500">
                    Required. 300x300px recommended, max 5MB
                  </span>
                </div>
              </div>
              {errors.photoUrl && <p className="text-sm text-red-500">{errors.photoUrl}</p>}
              {operationStatus === 'uploading' && (
                <p className="text-sm text-muted-foreground flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading photo...
                </p>
              )}
            </div>

            {/* Role-specific Fields */}
            {role === 'student' ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (Bangla) *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="englishName">English Name *</Label>
                    <Input
                      id="englishName"
                      value={englishName}
                      onChange={(e) => setEnglishName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.englishName && <p className="text-sm text-red-500">{errors.englishName}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="class">Class *</Label>
                    <Select value={className} onValueChange={setClassName} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_OPTIONS.map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.class && <p className="text-sm text-red-500">{errors.class}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Phone Number *</Label>
                    <Input
                      id="number"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.number && <p className="text-sm text-red-500">{errors.number}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group *</Label>
                    <Select value={studentBloodGroup} onValueChange={setStudentBloodGroup} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Blood Group" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUP_OPTIONS.map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bloodGroup && <p className="text-sm text-red-500">{errors.bloodGroup}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name *</Label>
                    <Input
                      id="fatherName"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.fatherName && <p className="text-sm text-red-500">{errors.fatherName}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother's Name *</Label>
                  <Input
                    id="motherName"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  {errors.motherName && <p className="text-sm text-red-500">{errors.motherName}</p>}
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div> */}
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nameBangla">Name (Bangla) *</Label>
                    <Input
                      id="nameBangla"
                      value={nameBangla}
                      onChange={(e) => setNameBangla(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.nameBangla && <p className="text-sm text-red-500">{errors.nameBangla}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameEnglish">Name (English) *</Label>
                    <Input
                      id="nameEnglish"
                      value={nameEnglish}
                      onChange={(e) => setNameEnglish(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.nameEnglish && <p className="text-sm text-red-500">{errors.nameEnglish}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Select value={designation} onValueChange={setDesignation} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {DESIGNATION_OPTIONS.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.designation && <p className="text-sm text-red-500">{errors.designation}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joiningDate">Joining Date *</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.joiningDate && <p className="text-sm text-red-500">{errors.joiningDate}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Select value={subject} onValueChange={setSubject} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECT_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nid">NID Number *</Label>
                    <Input
                      id="nid"
                      value={nid}
                      onChange={(e) => setNid(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.nid && <p className="text-sm text-red-500">{errors.nid}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.mobile && <p className="text-sm text-red-500">{errors.mobile}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary *</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      disabled={isLoading}
                    />
                    {errors.salary && <p className="text-sm text-red-500">{errors.salary}</p>}
                  </div>
                  {/* <div className="space-y-2">
                    <Label htmlFor="workingDays">Working Days *</Label>
                    <Input
                      id="workingDays"
                      type="number"
                      value={workingDays}
                      onChange={(e) => setWorkingDays(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      disabled={isLoading}
                    />
                    {errors.workingDays && <p className="text-sm text-red-500">{errors.workingDays}</p>}
                  </div> */}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group *</Label>
                  <Select value={staffBloodGroup} onValueChange={setStaffBloodGroup} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Blood Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUP_OPTIONS.map(bg => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bloodGroup && <p className="text-sm text-red-500">{errors.bloodGroup}</p>}
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading || !isFormValid} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-school-primary hover:underline">
                Log in here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignUp;