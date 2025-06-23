import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

// Asset interface
export interface Asset {
  id?: string;
  assetId: string;
  name: string;
  category: string;
  status: "available" | "in-use" | "maintenance" | "retired";
  location: string;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Utility to remove undefined fields
const cleanObject = (obj: any) => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

// Generate unique asset ID
const generateAssetId = () => {
  return `ASSET-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Create a new asset
export const createAsset = async (asset: Omit<Asset, "id" | "assetId" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const assetId = generateAssetId();
    const assetData = cleanObject({
      ...asset,
      assetId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const docRef = await addDoc(collection(db, "assets"), assetData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating asset:", error);
    throw new Error("Failed to create asset");
  }
};

// // Read all assets
// export const getAssets = async (): Promise<Asset[]> => {
//   try {
//     const q = query(collection(db, "assets"), orderBy("createdAt", "desc"));
//     const querySnapshot = await getDocs(q);
//     return querySnapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as Asset[];
//   } catch (error) {
//     console.error("Error fetching assets:", error);
//     throw new Error("Failed to fetch assets");
//   }
// };

export const getAssets = async (): Promise<Asset[]> => {
  const q = query(collection(db, "assets"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Asset[];
};


// Update an asset
export const updateAsset = async (id: string, asset: Partial<Asset>): Promise<void> => {
  try {
    const assetRef = doc(db, "assets", id);
    const cleanedAsset = cleanObject({ ...asset, updatedAt: Timestamp.now() });
    await updateDoc(assetRef, cleanedAsset);
  } catch (error) {
    console.error("Error updating asset:", error);
    throw new Error("Failed to update asset");
  }
};

// Delete an asset
export const deleteAsset = async (id: string): Promise<void> => {
  try {
    const assetRef = doc(db, "assets", id);
    await deleteDoc(assetRef);
  } catch (error) {
    console.error("Error deleting asset:", error);
    throw new Error("Failed to delete asset");
  }
};