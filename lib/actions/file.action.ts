import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { User } from 'firebase/auth';

const storage = getStorage();

export const uploadImageToStorage = async (file: File, userId: string): Promise<string> => {
  if (!file) throw new Error("No file provided");

  const storageRef = ref(storage, `profileImages/${userId}/${file.name}`);

  await uploadBytes(storageRef, file);

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

export const updateUserProfile = async (
  currentUser: User | null,
  name: string,
  image: string | null,
  imageFile: File | null = null
) => {
  if (!currentUser) throw new Error("User not authenticated");

  let imageUrl = image;

  if (imageFile) {
    imageUrl = await uploadImageToStorage(imageFile, currentUser.uid);
  }

  const userData = {
    name,
    image: imageUrl,
    email: currentUser.email,
  };

  await setDoc(doc(db, 'Users', currentUser.uid), userData);
};

export const handleImageChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  setImage: React.Dispatch<React.SetStateAction<string | null>>,
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>
) => {
  const file = e.target.files?.[0];
  if (file) {
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};