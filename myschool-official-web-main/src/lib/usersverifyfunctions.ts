import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { User, StudentData, StaffData } from './types';

interface ExtendedUser extends User {
  verified: boolean;
  staffId?: string;
  designation?: string;
  joiningDate?: any;
  nid?: string;
  photoUrl?: string;
}

export const getAllUsers = async (role: 'admin' | 'staff' | 'student'): Promise<ExtendedUser[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('role', '==', role));
    const usersSnapshot = await getDocs(q);
    const users = await Promise.all(
      usersSnapshot.docs.map(async (userDoc) => {
        const data = userDoc.data();
        const user: ExtendedUser = {
          id: userDoc.id,
          email: data.email || null,
          role: data.role as 'admin' | 'staff' | 'student',
          verified: data.verified ?? false,
          createdAt: data.createdAt || null,
        };

        if (data.role === 'student') {
          const studentDoc = await getDoc(doc(db, 'students', userDoc.id));
          if (studentDoc.exists()) {
            user.studentData = studentDoc.data() as StudentData;
          }
        } else if (data.role === 'staff' || data.role === 'admin') {
          const staffDoc = await getDoc(doc(db, 'staff', userDoc.id));
          if (staffDoc.exists()) {
            user.staffData = staffDoc.data() as StaffData;
            if (data.role === 'admin') {
              user.staffId = user.staffData?.staffId;
              user.designation = user.staffData?.designation;
              user.joiningDate = user.staffData?.joiningDate;
              user.nid = user.staffData?.nid;
              user.photoUrl = user.staffData?.photoUrl;
            }
          }
        }

        return user;
      })
    );
    return users;
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    throw new Error(error.message || 'Failed to fetch users');
  }
};

export const editUser = async (userId: string, updatedData: Partial<ExtendedUser>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const currentData = userDoc.data() as ExtendedUser;

    const updateData: Partial<ExtendedUser> = {
      email: updatedData.email ?? currentData.email,
      role: updatedData.role ?? currentData.role,
      verified: updatedData.verified ?? currentData.verified,
    };

    // Handle role-specific data
    if (updatedData.role === 'student' && updatedData.studentData) {
      const studentRef = doc(db, 'students', userId);
      const studentUpdate: StudentData = {
        studentId: updatedData.studentData.studentId || userId,
        name: updatedData.studentData.name || '',
        class: updatedData.studentData.class || '',
        number: updatedData.studentData.number || '',
        description: updatedData.studentData.description || '',
        englishName: updatedData.studentData.englishName || '',
        motherName: updatedData.studentData.motherName || '',
        fatherName: updatedData.studentData.fatherName || '',
        email: updatedData.studentData.email || updateData.email || '',
        bloodGroup: updatedData.studentData.bloodGroup || '',
        photoUrl: updatedData.studentData.photoUrl || '',
        nameBangla: updatedData.studentData.nameBangla || '',
        nameEnglish: updatedData.studentData.nameEnglish || '',
      };
      await setDoc(studentRef, studentUpdate, { merge: true });
      await deleteDoc(doc(db, 'staff', userId)).catch(() => {});
      delete updateData.staffId;
      delete updateData.designation;
      delete updateData.joiningDate;
      delete updateData.nid;
      delete updateData.photoUrl;
    } else if (updatedData.role === 'staff' && updatedData.staffData) {
      const staffRef = doc(db, 'staff', userId);
      const staffUpdate: StaffData = {
        staffId: updatedData.staffData.staffId || userId,
        nameBangla: updatedData.staffData.nameBangla || '',
        nameEnglish: updatedData.staffData.nameEnglish || '',
        subject: updatedData.staffData.subject || '',
        designation: updatedData.staffData.designation || '',
        joiningDate: updatedData.staffData.joiningDate || '',
        nid: updatedData.staffData.nid || '',
        mobile: updatedData.staffData.mobile || '',
        salary: updatedData.staffData.salary ?? 0,
        email: updatedData.staffData.email || updateData.email || '',
        address: updatedData.staffData.address || '',
        bloodGroup: updatedData.staffData.bloodGroup || '',
        workingDays: updatedData.staffData.workingDays ?? 0,
        photoUrl: updatedData.staffData.photoUrl || '',
      };
      await setDoc(staffRef, staffUpdate, { merge: true });
      await deleteDoc(doc(db, 'students', userId)).catch(() => {});
      delete updateData.staffId;
      delete updateData.designation;
      delete updateData.joiningDate;
      delete updateData.nid;
      delete updateData.photoUrl;
    } else if (updatedData.role === 'admin' && updatedData.staffData) {
      const staffRef = doc(db, 'staff', userId);
      const staffUpdate: StaffData = {
        staffId: updatedData.staffData.staffId || userId,
        nameBangla: updatedData.staffData.nameBangla || '',
        nameEnglish: updatedData.staffData.nameEnglish || '',
        subject: updatedData.staffData.subject || '',
        designation: updatedData.staffData.designation || '',
        joiningDate: updatedData.staffData.joiningDate || '',
        nid: updatedData.staffData.nid || '',
        mobile: updatedData.staffData.mobile || '',
        salary: updatedData.staffData.salary ?? 0,
        email: updatedData.staffData.email || updateData.email || '',
        address: updatedData.staffData.address || '',
        bloodGroup: updatedData.staffData.bloodGroup || '',
        workingDays: updatedData.staffData.workingDays ?? 0,
        photoUrl: updatedData.staffData.photoUrl || '',
      };
      await setDoc(staffRef, staffUpdate, { merge: true });
      updateData.staffId = staffUpdate.staffId;
      updateData.designation = staffUpdate.designation;
      updateData.joiningDate = staffUpdate.joiningDate;
      updateData.nid = staffUpdate.nid;
      updateData.photoUrl = staffUpdate.photoUrl;
      await deleteDoc(doc(db, 'students', userId)).catch(() => {});
    }

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof ExtendedUser] === undefined) {
        delete updateData[key as keyof ExtendedUser];
      }
    });

    await updateDoc(userRef, updateData);
  } catch (error: any) {
    console.error('Error in editUser:', error);
    throw new Error(error.message || 'Failed to update user');
  }
};




// Replace the existing deleteUser function

// export const deleteUser = async (userId: string): Promise<void> => {
//   try {
//     // Make a DELETE request to the server endpoint
//     const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     const responseData = await response.json();

//     if (!response.ok) {
//       console.error('Server error response:', {
//         userId,
//         status: response.status,
//         data: responseData,
//       });
//       throw new Error(responseData.error || 'Failed to delete user');
//     }

//     console.log('User deleted successfully:', { userId, response: responseData });
//   } catch (error: any) {
//     console.error('Error in deleteUser:', {
//       userId,
//       message: error.message,
//     });
//     throw new Error(error.message || 'Failed to delete user');
//   }
// };


export const deleteUser = async (userId: string, retries = 1): Promise<void> => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const responseData = await response.json();
        console.error('Server error response:', {
          userId,
          status: response.status,
          data: responseData,
        });
        throw new Error(responseData.error || 'Failed to delete user');
      }

      console.log('User deleted successfully:', { userId });
      return;
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed for user ${userId}:`, error.message);
      if (attempt > retries) {
        throw new Error(error.message || 'Failed to delete user after retries');
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
    }
  }
};