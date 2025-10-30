import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', isOpen, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    success: 'bg-emerald-600 text-white',
    info: 'bg-blue-600 text-white',
    error: 'bg-red-600 text-white',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
      <div className={`${typeStyles[type]} px-5 py-3.5 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px]`}>
        {icons[type]}
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto hover:opacity-80 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
