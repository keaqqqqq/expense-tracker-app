import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
  type?: 'success' | 'error';
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  duration = 2000, 
  onClose,
  type = 'success' 
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      container: "bg-green-100 border border-green-400 text-green-700",
      icon: "text-green-500",
      button: "text-green-500 hover:text-green-700"
    },
    error: {
      container: "bg-red-100 border border-red-400 text-red-700",
      icon: "text-red-500",
      button: "text-red-500 hover:text-red-700"
    }
  }[type];

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${styles.container} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px]`}>
        {type === 'success' ? (
          <CheckCircle2 className={`h-5 w-5 ${styles.icon}`} />
        ) : (
          <AlertCircle className={`h-5 w-5 ${styles.icon}`} />
        )}
        <p className="flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
          className={styles.button}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;