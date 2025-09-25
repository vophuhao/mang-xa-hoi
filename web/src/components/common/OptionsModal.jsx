import { useEffect } from "react";

const OptionsModal = ({ isOpen, onClose, title = "Tùy chọn", options = [], showCancel = true }) => {
  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="mx-4 w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b py-6 text-center dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>

        {/* Modal Body - Options List */}
        <div className="">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.onClick?.();
                onClose();
              }}
              className={`w-full cursor-pointer border-b px-6 py-4 text-center text-sm transition-colors last:border-b-0 dark:border-gray-700 ${
                option.danger
                  ? "border-gray-700 font-medium text-red-600"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Cancel Button */}
        {showCancel && (
          <div className="border-t-1 dark:border-gray-600">
            <button
              onClick={onClose}
              className="w-full cursor-pointer px-6 py-4 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700"
            >
              Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptionsModal;
