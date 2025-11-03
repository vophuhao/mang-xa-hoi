import { X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "danger" // "danger" | "warning" | "info"
}) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    },
    warning: {
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
    },
    info: {
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
    }
  };

  const currentStyle = typeStyles[type] || typeStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div 
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative mx-4 w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-gray-800">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content - bỏ icon, căn giữa text */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </div>

        {/* Actions - Nút Hủy bên trái, nút Xóa bên phải, cách đều nhau */}
        <div className="mt-6 flex justify-between space-x-4">
          {/* Nút Hủy - bên trái */}
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {cancelText}
          </button>
          
          {/* Nút Xóa - bên phải */}
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentStyle.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}