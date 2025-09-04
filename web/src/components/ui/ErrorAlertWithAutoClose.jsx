import { useEffect, useState } from "react";

import { useDispatch } from "react-redux";

import { clearError } from "@/store/slices/authSlice";

const ErrorAlertWithAutoClose = ({ message, autoCloseDelay = 5000 }) => {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message && autoCloseDelay) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => {
        clearTimeout(timer);
        dispatch(clearError()); // Xóa lỗi khi component unmount
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, autoCloseDelay, dispatch]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      dispatch(clearError());
    }, 300); // Delay để animation chạy xong
  };

  if (!message || !isVisible) return null;

  return (
    <div
      className={`mb-4 transform transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-start justify-between rounded-2xl border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-center">
          <svg
            className="mr-2 h-3.5 w-3.5 flex-shrink-0 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="pr-2 text-sm text-red-600 dark:text-red-400">
            {message}
          </span>
        </div>

        <button
          onClick={handleClose}
          className="ml-2 flex-shrink-0 rounded-full p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800/30 dark:hover:text-red-300"
          aria-label="Đóng thông báo"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ErrorAlertWithAutoClose;
