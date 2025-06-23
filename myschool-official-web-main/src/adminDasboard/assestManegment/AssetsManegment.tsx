import React, { useState, useEffect, useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  Asset,
  createAsset,
  getAssets,
  updateAsset,
  deleteAsset,
} from "@/lib/assetsmanegment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { Timestamp } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { z } from "zod";
import { Loader2, Plus, Trash2, Edit2, X, Filter, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebounce } from "use-debounce";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Define User interface
interface User {
  id: string;
  role: "admin" | "staff";
}

// Define ChartConfig interface
interface ChartConfig {
  [key: string]: { label: string; color: string };
}

// Define FilterState interface
interface FilterState {
  id: string;
  name: string;
  category: string[];
  status: string[];
  location: string;
  createdAtStart: Date | null;
  createdAtEnd: Date | null;
  hasImage: "all" | "yes" | "no";
}

// Zod schema for asset validation
const assetSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["available", "in-use", "maintenance", "retired"]),
  location: z.string().max(100, "Location is too long").optional(),
  image: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || (file && ["image/jpeg", "image/png"].includes(file.type)),
      "Only JPEG or PNG images are allowed"
    )
    .refine((file) => !file || (file && file.size <= 5 * 1024 * 1024), "Image must be less than 5MB"),
});

// Custom hook for current user
const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return { user, loading };
};

// Image upload to ImgBB
const uploadImageToImgBB = async (file: File): Promise<string> => {
  const IMAGE_HOST_KEY = import.meta.env.VITE_IMGBB_API_KEY;
  if (!IMAGE_HOST_KEY) throw new Error("ImgBB API key not configured");

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMAGE_HOST_KEY}`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Error uploading image to ImgBB");
    const data = await response.json();
    return data.data.url;
  } catch (error) {
    throw error;
  }
};

// Image Source Selection Dialog
interface ImageSourceDialogProps {
  onSelect: (file: File) => void;
  isProcessing: boolean;
}

const ImageSourceDialog: React.FC<ImageSourceDialogProps> = ({ onSelect, isProcessing }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
      setIsOpen(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={isProcessing} className="w-full">
          Upload Image
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Image Source</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <label>
              Take Photo
              <Input
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <label>
              Select File
              <Input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Image View Modal
interface ImageViewModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  imageUrl: string | null;
  assetName: string;
}

const ImageViewModal: React.FC<ImageViewModalProps> = ({ isOpen, setIsOpen, imageUrl, assetName }) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isImageError, setIsImageError] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[90vw] max-h-[80vh] p-4 bg-white">
        <DialogHeader>
          <DialogTitle>{assetName}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center min-h-[200px] max-h-[60vh]">
          {imageUrl ? (
            <>
              {isImageLoading && (
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              )}
              {isImageError ? (
                <p className="text-red-500 text-sm">Image not available</p>
              ) : (
                <img
                  src={imageUrl}
                  alt={assetName}
                  className={`max-w-full max-h-[60vh] object-contain ${isImageLoading ? "hidden" : "block"}`}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => {
                    setIsImageLoading(false);
                    setIsImageError(true);
                  }}
                />
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">No image available</p>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Asset Form Modal Component
interface AssetFormModalProps {
  editingAsset: Asset | null;
  newAsset: Omit<Asset, "id" | "assetId" | "createdAt" | "updatedAt"> & { image?: File };
  setNewAsset: React.Dispatch<React.SetStateAction<Omit<Asset, "id" | "assetId" | "createdAt" | "updatedAt"> & { image?: File }>>;
  setEditingAsset: React.Dispatch<React.SetStateAction<Asset | null>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isProcessing: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({
  editingAsset,
  newAsset,
  setNewAsset,
  setEditingAsset,
  onSubmit,
  isProcessing,
  isOpen,
  setIsOpen,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (newAsset.image) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(newAsset.image);
    } else {
      setImagePreview(null);
    }
  }, [newAsset.image]);

  const validateForm = () => {
    try {
      assetSchema.parse({ ...newAsset });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(e);
      setIsOpen(false);
    }
  };

  const handleImageSelect = (file: File) => {
    try {
      assetSchema.shape.image.parse(file);
      setNewAsset({ ...newAsset, image: file });
      setErrors((prev) => ({ ...prev, image: "" }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, image: error.errors[0].message }));
      }
    }
  };

  const handleClearImage = () => {
    setNewAsset({ ...newAsset, image: undefined });
    setImagePreview(null);
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setNewAsset({
          name: "",
          category: "",
          status: "available",
          location: "",
          image: undefined,
        });
        setEditingAsset(null);
        setErrors({});
        setImagePreview(null);
      }
      setIsOpen(open);
    }}>
      <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{editingAsset ? "Edit Asset" : "Add Asset"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <Input
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              placeholder="Enter asset name"
              required
              className="mt-1"
              disabled={isProcessing}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <Select
              value={newAsset.category}
              onValueChange={(value) => setNewAsset({ ...newAsset, category: value })}
              disabled={isProcessing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IT Equipment">IT Equipment</SelectItem>
                <SelectItem value="Furniture">Furniture</SelectItem>
                <SelectItem value="Lab Equipment">Lab Equipment</SelectItem>
                <SelectItem value="Sports Gear">Sports Gear</SelectItem>
                <SelectItem value="Library Books">Library Books</SelectItem>
                <SelectItem value="Musical Instruments">Musical Instruments</SelectItem>
                <SelectItem value="Kitchen Equipment">Kitchen Equipment</SelectItem>
                <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Vehicles">Vehicles</SelectItem>
                <SelectItem value="Gardening Tools">Gardening Tools</SelectItem>
                <SelectItem value="Audio-Visual Equipment">Audio-Visual Equipment</SelectItem>
                <SelectItem value="Cleaning Equipment">Cleaning Equipment</SelectItem>
                <SelectItem value="Safety Gear">Safety Gear</SelectItem>
                <SelectItem value="Art Supplies">Art Supplies</SelectItem>
                <SelectItem value="Construction Tools">Construction Tools</SelectItem>
                <SelectItem value="Playground Equipment">Playground Equipment</SelectItem>
                <SelectItem value="Textiles">Textiles</SelectItem>
                <SelectItem value="Scientific Instruments">Scientific Instruments</SelectItem>
                <SelectItem value="Stationery">Stationery</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <Select
              value={newAsset.status}
              onValueChange={(value) => setNewAsset({ ...newAsset, status: value as Asset["status"] })}
              disabled={isProcessing}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <Input
              value={newAsset.location}
              onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
              placeholder="Enter location (e.g., Room 101)"
              className="mt-1"
              disabled={isProcessing}
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <ImageSourceDialog onSelect={handleImageSelect} isProcessing={isProcessing} />
              {newAsset.image && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearImage}
                  disabled={isProcessing}
                  className="mt-2 sm:mt-0"
                >
                  Clear Image
                </Button>
              )}
            </div>
            <div className="mt-2">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-[100px] max-h-[100px] object-contain rounded"
                />
              ) : (
                <p className="text-sm text-gray-500">No image selected</p>
              )}
            </div>
            {newAsset.image && (
              <p className="text-sm text-gray-500 mt-1">Selected: {newAsset.image.name}</p>
            )}
            {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : editingAsset ? (
                "Update"
              ) : (
                "Add"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewAsset({
                  name: "",
                  category: "",
                  status: "available",
                  location: "",
                  image: undefined,
                });
                setEditingAsset(null);
                setIsOpen(false);
                setErrors({});
                setImagePreview(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Asset Table Component
interface AssetTableProps {
  assets: Asset[];
  canEdit: boolean;
  setNewAsset: React.Dispatch<React.SetStateAction<Omit<Asset, "id" | "assetId" | "createdAt" | "updatedAt"> & { image?: File }>>;
  setEditingAsset: React.Dispatch<React.SetStateAction<Asset | null>>;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void;
  isProcessing: boolean;
  handleDelete: (id: string, name: string) => void;
  setImageModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedImage: React.Dispatch<React.SetStateAction<{ url: string | null; name: string }>>;
}

const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  canEdit,
  setNewAsset,
  setEditingAsset,
  setModalOpen,
  toast,
  isProcessing,
  handleDelete,
  setImageModalOpen,
  setSelectedImage,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs sm:text-sm">ID</TableHead>
            <TableHead className="text-xs sm:text-sm">Name</TableHead>
            <TableHead className="text-xs sm:text-sm">Category</TableHead>
            <TableHead className="text-xs sm:text-sm">Status</TableHead>
            <TableHead className="text-xs sm:text-sm">Location</TableHead>
            <TableHead className="text-xs sm:text-sm">Created At</TableHead>
            <TableHead className="text-xs sm:text-sm">Image</TableHead>
            {canEdit && <TableHead className="text-xs sm:text-sm">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="text-xs sm:text-sm">{asset.assetId}</TableCell>
              <TableCell className="text-xs sm:text-sm">{asset.name}</TableCell>
              <TableCell className="text-xs sm:text-sm">{asset.category}</TableCell>
              <TableCell className="text-xs sm:text-sm">{asset.status}</TableCell>
              <TableCell className="text-xs sm:text-sm">{asset.location || "-"}</TableCell>
              <TableCell className="text-xs sm:text-sm">
                {asset.createdAt
                  ? new Date(asset.createdAt.toDate()).toLocaleString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "-"}
              </TableCell>
              <TableCell>
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="max-w-[40px] sm:max-w-[60px] h-auto rounded cursor-pointer"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    onClick={() => {
                      setSelectedImage({ url: asset.imageUrl, name: asset.name });
                      setImageModalOpen(true);
                    }}
                  />
                ) : (
                  "-"
                )}
              </TableCell>
              {canEdit && (
                <TableCell>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAsset(asset);
                              setNewAsset({
                                name: asset.name,
                                category: asset.category,
                                status: asset.status,
                                location: asset.location || "",
                                image: undefined,
                              });
                              setModalOpen(true);
                            }}
                            disabled={isProcessing}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit this asset</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(asset.id!, asset.name)}
                            disabled={isProcessing}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete this asset</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Delete Confirmation Dialog
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  assetName: string;
  onConfirm: () => void;
  isProcessing: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  setIsOpen,
  assetName,
  onConfirm,
  isProcessing,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete the asset "{assetName}"? This action cannot be undone.
        </p>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
const AssetsManegment: React.FC = () => {
  const { user, loading } = useCurrentUser();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newAsset, setNewAsset] = useState<Omit<Asset, "id" | "assetId" | "createdAt" | "updatedAt"> & { image?: File }>({
    name: "",
    category: "",
    status: "available",
    location: "",
    image: undefined,
  });
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<{ id: string; name: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string | null; name: string }>({ url: null, name: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [filterState, setFilterState] = useState<FilterState>({
    id: "",
    name: "",
    category: [],
    status: [],
    location: "",
    createdAtStart: null,
    createdAtEnd: null,
    hasImage: "all",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { toast } = useToast();

  // Fetch assets
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const assetsData = await getAssets();
        // Sort by createdAt descending (newest first)
        assetsData.sort((a, b) =>
          b.createdAt && a.createdAt
            ? b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
            : 0
        );
        setAssets(assetsData);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch assets. Please try again." });
      }
    };
    if (!loading && user) fetchAssets();
  }, [loading, user, toast]);

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchLower = debouncedSearchQuery.toLowerCase();
      const matchesSearch =
        !searchLower ||
        asset.assetId.toLowerCase().includes(searchLower) ||
        asset.name.toLowerCase().includes(searchLower) ||
        asset.category.toLowerCase().includes(searchLower) ||
        asset.status.toLowerCase().includes(searchLower) ||
        (asset.location && asset.location.toLowerCase().includes(searchLower)) ||
        (asset.createdAt &&
          new Date(asset.createdAt.toDate()).toLocaleString("en-US").toLowerCase().includes(searchLower)) ||
        (asset.imageUrl && "image".includes(searchLower));

      const matchesFilters =
        (!filterState.id || asset.assetId.toLowerCase().includes(filterState.id.toLowerCase())) &&
        (!filterState.name || asset.name.toLowerCase().includes(filterState.name.toLowerCase())) &&
        (filterState.category.length === 0 || filterState.category.includes(asset.category)) &&
        (filterState.status.length === 0 || filterState.status.includes(asset.status)) &&
        (!filterState.location || (asset.location && asset.location.toLowerCase().includes(filterState.location.toLowerCase()))) &&
        (!filterState.createdAtStart || (asset.createdAt && asset.createdAt.toDate() >= filterState.createdAtStart)) &&
        (!filterState.createdAtEnd || (asset.createdAt && asset.createdAt.toDate() <= filterState.createdAtEnd)) &&
        (filterState.hasImage === "all" ||
          (filterState.hasImage === "yes" && asset.imageUrl) ||
          (filterState.hasImage === "no" && !asset.imageUrl));

      return matchesSearch && matchesFilters;
    });
  }, [assets, debouncedSearchQuery, filterState]);

  // Handle asset form submission
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      let imageUrl: string | undefined;
      if (newAsset.image) {
        imageUrl = await uploadImageToImgBB(newAsset.image);
      }
      const assetData = {
        name: newAsset.name,
        category: newAsset.category,
        status: newAsset.status,
        location: newAsset.location,
        imageUrl,
      };
      if (editingAsset) {
        await updateAsset(editingAsset.id!, assetData);
        toast({ title: "Success", description: `Asset "${newAsset.name}" updated successfully.` });
        setEditingAsset(null);
      } else {
        await createAsset(assetData);
        toast({ title: "Success", description: `Asset "${newAsset.name}" added successfully.` });
      }
      const updatedAssets = await getAssets();
      updatedAssets.sort((a, b) =>
        b.createdAt && a.createdAt
          ? b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
          : 0
      );
      setAssets(updatedAssets);
      setNewAsset({ name: "", category: "", status: "available", location: "", image: undefined });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: editingAsset
          ? `Failed to update asset: ${error.message}`
          : `Failed to add asset: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete confirmation
  const handleDelete = (id: string, name: string) => {
    setAssetToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    setIsProcessing(true);
    try {
      await deleteAsset(assetToDelete.id);
      toast({ title: "Success", description: `Asset "${assetToDelete.name}" deleted successfully.` });
      const updatedAssets = await getAssets();
      updatedAssets.sort((a, b) =>
        b.createdAt && a.createdAt
          ? b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
          : 0
      );
      setAssets(updatedAssets);
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete asset: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = () => {
  setIsProcessing(true);
  const exportDate = new Date().toLocaleDateString();
  const totalAssets = filteredAssets.length;
  const summary = {
    total: totalAssets,
    available: filteredAssets.filter((a) => a.status === "available").length,
    inUse: filteredAssets.filter((a) => a.status === "in-use").length,
    maintenance: filteredAssets.filter((a) => a.status === "maintenance").length,
    retired: filteredAssets.filter((a) => a.status === "retired").length,
  };

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>MySchool - Asset Report</title>
          <style>
            @media print {
              @page { margin: 2cm; }
              th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.5;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3498db;
              padding-bottom: 15px;
            }
            .header h1 {
              color: #2c3e50;
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              color: #555;
              font-size: 14px;
              margin: 5px 0 0;
            }
            .stats {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              border: 1px solid #ddd;
            }
            .summary {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              font-size: 14px;
              border: 1px solid #ddd;
            }
            .summary h3 {
              margin: 0 0 10px 0;
              font-size: 16px;
              color: #2c3e50;
            }
            .summary p {
              margin: 5px 0;
              color: #555;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background-color: #3498db;
              color: #fff;
              font-weight: 600;
              text-transform: uppercase;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f1f1f1;
            }
            img {
              max-width: 60px;
              height: auto;
              border-radius: 4px;
              display: block;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #777;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            @media (max-width: 768px) {
              table, th, td {
                font-size: 11px;
                padding: 6px;
              }
              img {
                max-width: 40px;
              }
              .stats, .summary {
                flex-direction: column;
                gap: 8px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MySchool - Asset Report</h1>
              <p>Generated on: ${exportDate}</p>
            </div>
            <div class="stats">
              <span>Total Assets: ${totalAssets}</span>
              <span>Exported on: ${exportDate}</span>
            </div>
            <div class="summary">
              <h3>Asset Summary</h3>
              <p>Total Assets: ${summary.total}</p>
              <p>Available: ${summary.available}</p>
              <p>In Use: ${summary.inUse}</p>
              <p>Maintenance: ${summary.maintenance}</p>
              <p>Retired: ${summary.retired}</p>
            </div>
            <table>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Location</th>
                <th>Created At</th>
                <th>Image</th>
              </tr>
              ${filteredAssets
                .map(
                  (asset) => `
                <tr>
                  <td>${asset.assetId || '-'}</td>
                  <td>${asset.name || '-'}</td>
                  <td>${asset.category || '-'}</td>
                  <td>${asset.status || '-'}</td>
                  <td>${asset.location || '-'}</td>
                  <td>${
                    asset.createdAt
                      ? new Date(asset.createdAt.toDate()).toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : '-'
                  }</td>
                  <td>${
                    asset.imageUrl
                      ? `<img src="${asset.imageUrl}" alt="${asset.name || 'Asset'}" onerror="this.style.display='none';this.nextSibling.style.display='block'" /><span style="display:none">Image not available</span>`
                      : 'No image'
                  }</td>
                </tr>
              `
                )
                .join('')}
            </table>
            <div class="footer">
              Generated by MySchool Official Website • https://myschool-offical.netlify.app
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  } else {
    toast({ variant: "destructive", title: "Error", description: "Failed to open print window. Please allow pop-ups." });
  }
  setIsProcessing(false);
};


  // Handle CSV export
  const handleExportCSV = () => {
    setIsProcessing(true);
    try {
      const headers = ["ID", "Name", "Category", "Status", "Location", "Created At", "Image URL"];
      const rows = filteredAssets.map((asset) => [
        asset.assetId,
        `"${asset.name.replace(/"/g, '""')}"`, // Escape quotes
        asset.category,
        asset.status,
        asset.location || "-",
        asset.createdAt
          ? new Date(asset.createdAt.toDate()).toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-",
        asset.imageUrl || "-",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute("href", url);
      link.setAttribute("download", `assets_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "CSV exported successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to export CSV: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilterState({
      id: "",
      name: "",
      category: [],
      status: [],
      location: "",
      createdAtStart: null,
      createdAtEnd: null,
      hasImage: "all",
    });
    setSearchQuery("");
  };

  // Permissions
  const userRole = user?.role || "staff";
  const canEdit = userRole === "admin";

  // Chart configuration
  const chartConfig: ChartConfig = {
    available: { label: "Available", color: "#10B981" },
    inUse: { label: "In Use", color: "#3B82F6" },
    maintenance: { label: "Maintenance", color: "#F59E0B" },
    retired: { label: "Retired", color: "#EF4444" },
  };

  // Chart data
  const chartData = [
    { name: "available", value: filteredAssets.filter((a) => a.status === "available").length },
    { name: "inUse", value: filteredAssets.filter((a) => a.status === "in-use").length },
    { name: "maintenance", value: filteredAssets.filter((a) => a.status === "maintenance").length },
    { name: "retired", value: filteredAssets.filter((a) => a.status === "retired").length },
  ];

  if (loading) return <div className="text-center p-4 text-gray-600">Loading...</div>;
  if (!user) return <div className="text-center p-4 text-gray-600">Please log in to access asset management.</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="assets" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            Assets
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingAsset(null);
                  setNewAsset({
                    name: "",
                    category: "",
                    status: "available",
                    location: "",
                    image: undefined,
                  });
                  setModalOpen(true);
                }}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Asset
              </Button>
            )}
            <Button
              onClick={handleExportPDF}
              disabled={isProcessing || filteredAssets.length === 0}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                "Export to PDF"
              )}
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={isProcessing || filteredAssets.length === 0}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting CSV...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </>
              )}
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full sm:w-1/3"
                disabled={isProcessing}
              />
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-4 bg-white">
                  <DialogHeader>
                    <DialogTitle>Filter Assets</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID</label>
                      <Input
                        value={filterState.id}
                        onChange={(e) => setFilterState({ ...filterState, id: e.target.value })}
                        placeholder="Filter by ID"
                        className="mt-1"
                        disabled={isProcessing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <Input
                        value={filterState.name}
                        onChange={(e) => setFilterState({ ...filterState, name: e.target.value })}
                        placeholder="Filter by name"
                        className="mt-1"
                        disabled={isProcessing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <Select
                        value={filterState.category}
                        onValueChange={(value) => setFilterState({ ...filterState, category: value })}
                        disabled={isProcessing}
                        multiple
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select categories" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "IT Equipment",
                            "Furniture",
                            "Lab Equipment",
                            "Sports Gear",
                            "Library Books",
                            "Musical Instruments",
                            "Kitchen Equipment",
                            "Medical Supplies",
                            "Office Supplies",
                            "Vehicles",
                            "Gardening Tools",
                            "Audio-Visual Equipment",
                            "Cleaning Equipment",
                            "Safety Gear",
                            "Art Supplies",
                            "Construction Tools",
                            "Playground Equipment",
                            "Textiles",
                            "Scientific Instruments",
                            "Stationery",
                          ].map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <Select
                        value={filterState.status}
                        onValueChange={(value) => setFilterState({ ...filterState, status: value })}
                        disabled={isProcessing}
                        multiple
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="in-use">In Use</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <Input
                        value={filterState.location}
                        onChange={(e) => setFilterState({ ...filterState, location: e.target.value })}
                        placeholder="Filter by location"
                        className="mt-1"
                        disabled={isProcessing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created At (Start)</label>
                      <DatePicker
                        selected={filterState.createdAtStart}
                        onChange={(date: Date | null) => setFilterState({ ...filterState, createdAtStart: date })}
                        selectsStart
                        startDate={filterState.createdAtStart}
                        endDate={filterState.createdAtEnd}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="yyyy-MM-dd HH:mm"
                        placeholderText="Select start date"
                        className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                        disabled={isProcessing}
                        isClearable
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created At (End)</label>
                      <DatePicker
                        selected={filterState.createdAtEnd}
                        onChange={(date: Date | null) => setFilterState({ ...filterState, createdAtEnd: date })}
                        selectsEnd
                        startDate={filterState.createdAtStart}
                        endDate={filterState.createdAtEnd}
                        minDate={filterState.createdAtStart}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="yyyy-MM-dd HH:mm"
                        placeholderText="Select end date"
                        className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                        disabled={isProcessing}
                        isClearable
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Has Image</label>
                      <Select
                        value={filterState.hasImage}
                        onValueChange={(value) => setFilterState({ ...filterState, hasImage: value as "all" | "yes" | "no" })}
                        disabled={isProcessing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select image filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="yes">Has Image</SelectItem>
                          <SelectItem value="no">No Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      disabled={isProcessing}
                      className="w-full sm:w-auto"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsFilterOpen(false)}
                      disabled={isProcessing}
                      className="w-full sm:w-auto"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-gray-600">
              Showing {filteredAssets.length} of {assets.length} assets
            </p>
          </div>

          <AssetFormModal
            editingAsset={editingAsset}
            newAsset={newAsset}
            setNewAsset={setNewAsset}
            setEditingAsset={setEditingAsset}
            onSubmit={handleAssetSubmit}
            isProcessing={isProcessing}
            isOpen={modalOpen}
            setIsOpen={setModalOpen}
          />
          <AssetTable
            assets={filteredAssets}
            canEdit={canEdit}
            setNewAsset={setNewAsset}
            setEditingAsset={setEditingAsset}
            setModalOpen={setModalOpen}
            toast={toast}
            isProcessing={isProcessing}
            handleDelete={handleDelete}
            setImageModalOpen={setImageModalOpen}
            setSelectedImage={setSelectedImage}
          />
          <ImageViewModal
            isOpen={imageModalOpen}
            setIsOpen={setImageModalOpen}
            imageUrl={selectedImage.url}
            assetName={selectedImage.name}
          />
          <DeleteConfirmDialog
            isOpen={deleteDialogOpen}
            setIsOpen={setDeleteDialogOpen}
            assetName={assetToDelete?.name || ""}
            onConfirm={confirmDelete}
            isProcessing={isProcessing}
          />
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Asset Status</h2>
              <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px]">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartConfig[entry.name as keyof typeof chartConfig].color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Summary</h2>
              <p className="text-sm text-gray-600">Total Assets: {filteredAssets.length}</p>
              <p className="text-sm text-gray-600">Available: {filteredAssets.filter((a) => a.status === "available").length}</p>
              <p className="text-sm text-gray-600">In Use: {filteredAssets.filter((a) => a.status === "in-use").length}</p>
              <p className="text-sm text-gray-600">Maintenance: {filteredAssets.filter((a) => a.status === "maintenance").length}</p>
              <p className="text-sm text-gray-600">Retired: {filteredAssets.filter((a) => a.status === "retired").length}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetsManegment;