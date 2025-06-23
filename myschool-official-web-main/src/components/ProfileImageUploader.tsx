// File: src/components/ProfileImageUploader.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Upload, X, User } from "lucide-react";

interface ProfileImageUploaderProps {
  currentImageUrl?: string;
  onImageChange: (file: File | null) => void;
  className?: string;
}

const ProfileImageUploader = ({
  currentImageUrl,
  onImageChange,
  className
}: ProfileImageUploaderProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(currentImageUrl || null);
  const [isHovering, setIsHovering] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        toast.error('অনুগ্রহ করে শুধুমাত্র ছবি আপলোড করুন।');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ছবির সাইজ ৫MB এর বেশি হতে পারবে না।');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      onImageChange(file);
      toast.success('প্রোফাইল ছবি আপডেট হয়েছে।');
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    onImageChange(null);
    toast.success('প্রোফাইল ছবি মুছে ফেলা হয়েছে।');
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
          <AvatarImage src={previewImage || undefined} />
          <AvatarFallback className="bg-blue-100 text-blue-800">
            <User size={50} />
          </AvatarFallback>
        </Avatar>

        {isHovering && previewImage && (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 rounded-full w-8 h-8"
            onClick={removeImage}
            disabled={true}
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        <div className="absolute bottom-0 right-0">
          <label htmlFor="profile-image-upload" className="cursor-pointer">
            <div className="bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
            </div>
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={true}
            />
          </label>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">সর্বোচ্চ ৫MB</p>
    </div>
  );
};

export default ProfileImageUploader;
