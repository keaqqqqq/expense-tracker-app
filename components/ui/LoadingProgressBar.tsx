'use client';
import { useEffect, useState } from 'react';

interface LoadingProgressBarProps {
  isLoading?: boolean;
  color?: string;
  height?: number;
}

export default function LoadingProgressBar({ 
  isLoading = true, 
  color = 'var(--primary)', 
  height = 2
}: LoadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      const timer = setTimeout(() => setVisible(false), 300); // Increased from 200
      return () => clearTimeout(timer);
    }

    setVisible(true);
    setProgress(0);
    
    // Slower progress increment
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        // Slower increment
        const increment = Math.max(0.5, (100 - prev) / 20); // Changed from 10 to 20
        return Math.min(90, prev + increment);
      });
    }, 150); // Changed from 100 to 150

    return () => clearInterval(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50"
      style={{ height: `${height}px` }}
    >
      <div
        className="h-full transition-all duration-300 ease-out" // Changed from 200 to 300
        style={{
          width: `${progress}%`,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}