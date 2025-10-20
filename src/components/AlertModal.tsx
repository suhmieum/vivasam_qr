interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
}

export default function AlertModal({ isOpen, title, message, onClose }: AlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
        <div className="p-6">
          {title && <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>}
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-[#FF8800] hover:bg-[#e67700] text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
