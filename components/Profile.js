'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Profile() {
    const { currentUser, userDataObj } = useAuth();
    const [name, setName] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                const docRef = doc(db, 'Users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setName(data.name || '');
                    setImage(data.image || null); 
                }
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !image) return;

        const userData = {
            name,
            image,
            email: currentUser.email,
        };

        try {
            await setDoc(doc(db, 'Users', currentUser.uid), userData);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error("Error updating profile:", error);
            alert('Error updating profile');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result); 
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className='flex flex-col items-center'>
            <h1 className='text-2xl mb-4'>Profile</h1>
            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Name'
                    className='border border-solid border-indigo-400 rounded-full px-4 py-2'
                    required
                />
                <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='border border-solid border-indigo-400 rounded-full px-4 py-2'
                    required
                />
                {image && <img src={image} alt="Preview" className='w-32 h-32 object-cover rounded-full' />}
                <button type='submit' className='bg-indigo-600 text-white rounded-full px-4 py-2'>
                    Submit
                </button>
            </form>
        </div>
    );
}
