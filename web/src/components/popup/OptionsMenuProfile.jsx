import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import { useBlockActions } from "@/hooks/useBlock";
import ReportModal from "@/modals/ReportModal";


export default function OptionsMenuProfile({ onClose, user }) {
  const [showReportModal, setShowReportModal] = useState(false);

  const { toggleBlockUser } = useBlockActions();
  const options = [
    { label: "Báo cáo", action: () => setShowReportModal(true), danger: true },
    { label: "Chặn", action: () => handleBlockUser(user._id), danger: true },
    { label: "Sao chép liên kết" },
    { label: "Hủy", action: onClose },
  ];
    const handleBlockUser = async (userId) => {
      const response = await toggleBlockUser(userId);
      console.log("Block/Unblock response:", response);
      if (response.success) {
        toast.success( "Đã cập nhật trạng thái chặn");
        onClose();
        window.location.reload(); // Reload trang để cập nhật trạng thái chặn
      }
    };
  return (
    <>
      <AnimatePresence>
        {!showReportModal && (
          <>
            {/* Overlay làm mờ toàn bộ UI */}
            <motion.div
              key="overlay"
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Menu hiển thị giữa màn hình */}
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-120
                         left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={opt.action}
                  className={`block w-full text-left px-4  py-5  border-b border-gray-300
                    hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors duration-150
                    ${opt.danger ? "text-red-500 font-semibold" : "text-gray-800 dark:text-gray-200"}`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal báo cáo */}
      {showReportModal && (
        <ReportModal
          user={user}
          onBack={() => setShowReportModal(false)}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}
