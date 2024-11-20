// components/BackButton.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const BackButton = () => {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()}
      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
    >
      ← Back to friends
    </button>
  );
};

export default BackButton;