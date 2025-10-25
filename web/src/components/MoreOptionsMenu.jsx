import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import ReportModal from "@/modals/ReportModal";

export default function MoreOptionsMenu({ onClose, position ,reelId}) {
    const [showReportModal, setShowReportModal] = useState(false);

    const options = [
        { label: "Báo cáo", action: () => setShowReportModal(true), danger: true },
        { label: "Sao chép liên kết", action: () => handleCopyLink() },   
    ];

    const handleCopyLink = async () => {
        try {
          const url = `${window.location.href}`;
    
          // Use modern clipboard API with fallback
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          } else {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = url;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
          }
    
          toast.success("Đã sao chép liên kết của bài viết", {
            position: "bottom-center",
            autoClose: 2500,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
          });
        } catch (error) {
          console.error("Failed to copy link:", error);
          toast.error("Không thể sao chép liên kết", {
            position: "bottom-center",
            autoClose: 2500,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
          });
        }
      };

    return (
        <>
            <AnimatePresence>
                {!showReportModal && (
                    <>
                        {/* Overlay đen nhẹ để click ngoài đóng menu */}
                        <motion.div
                            key="overlay"
                            className="fixed inset-0 bg-transparent z-40"
                            onClick={onClose}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        {/* Menu nổi */}
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            className="fixed z-50 bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-2 w-70 h-60"
                            style={{
                                top: position?.y - 280, // nằm trên icon
                                left: position?.x + 0, // lệch sang phải
                            }}
                        >
                            {options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={opt.action}
                                    className={`cursor-pointer block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 ${opt.danger
                                            ? "text-red-500 font-semibold"
                                            : "text-gray-800 dark:text-gray-200"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </motion.div>

                    </>
                )}
            </AnimatePresence>

            {showReportModal && (
                <ReportModal reelId={reelId} onBack={() => setShowReportModal(false)} onClose={() => setShowReportModal(false)} />
            )}
        </>
    );
}
