interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex gap-2">
        <div
          className={`${sizeClasses[size]} bg-[#FF8800] rounded-full animate-bounce`}
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className={`${sizeClasses[size]} bg-[#FF8800] rounded-full animate-bounce`}
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className={`${sizeClasses[size]} bg-[#FF8800] rounded-full animate-bounce`}
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
      {message && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}
