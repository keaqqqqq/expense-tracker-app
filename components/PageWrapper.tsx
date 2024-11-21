'use client';
import { ReactNode, useEffect, useState } from 'react';
import LoadingProgressBar from './ui/LoadingProgressBar';
interface PageWrapperProps {
  children: ReactNode;
  loading?: boolean;
}

export default function PageWrapper({ 
  children, 
  loading = false
}: PageWrapperProps) {
  const [isLoading, setIsLoading] = useState(loading);
  
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  return (
    <>
      <LoadingProgressBar isLoading={isLoading} />
      <div style={{ opacity: isLoading ? 0.7 : 1 }} className="transition-opacity duration-300">
        {children}
      </div>
    </>
  );
}