import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

import { report } from "@/lib/api";


export default function ReportModal({ reelId, user, onBack, onClose }) {
    const [step, setStep] = useState("select"); // 'select' | 'thankyou'
    const [loading, setLoading] = useState(false);

    const isUserReport = !!user;
    const reasons = isUserReport
        ? [
            "Spam hoặc tài khoản giả mạo",
            "Quấy rối hoặc bắt nạt",
            "Chia sẻ nội dung không phù hợp",
            "Ngôn từ thù ghét hoặc bạo lực",
            "Tự tử hoặc tự gây thương tích",
            "Khác"
        ]
        : [
            "Chỉ là tôi không thích nội dung này",
            "Bắt nạt hoặc liên hệ theo cách không mong muốn",
            "Tự tử, tự gây thương tích hoặc ăn uống thất thường",
            "Bạo lực, thù ghét hoặc bóc lột",
            "Bán hoặc quảng cáo mặt hàng bị hạn chế",
            "Ảnh khỏa thân hoặc hoạt động tình dục",
            "Lừa đảo, gian lận hoặc spam",
            "Thông tin sai sự thật",
        ];

    const handleReport = async (reason) => {
        setLoading(true);
        try {
        const data = isUserReport
            ? {
                targetId: user._id,
                targetType: "user",
                reason,
            }
            : {
                targetId: reelId,
                targetType: "post",
                reason,
            };
        const res = await report(data);
        if (res.success) setStep("thankyou");
        } catch (err) {
        alert("Đã xảy ra lỗi. Vui lòng thử lại sau!");
        } finally {
        setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                key="overlay"
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-neutral-900 w-[550px] rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {step === "select" ? (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
                                <h2 className="font-semibold text-lg text-black dark:text-white">
                                    Báo cáo
                                </h2>
                                <button onClick={onClose}>
                                    <X className="w-6 h-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col divide-y divide-gray-200 dark:divide-neutral-700">
                                <p className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-300">
                                    Tại sao bạn báo cáo bài viết này?
                                </p>
                                {reasons.map((r, i) => (
                                    <button
                                        key={i}
                                        disabled={loading}
                                        onClick={() => handleReport(r)}
                                        className="text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-gray-200 transition"
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Trang cảm ơn */}
                            {/* Trang cảm ơn - Cải tiến giao diện */}
                            <div className="flex flex-col items-center justify-center text-center p-10 space-y-6">
                                {/* Hiệu ứng icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 120, damping: 10 }}
                                    className="rounded-full bg-green-100 dark:bg-green-900/40 p-5"
                                >
                                    <CheckCircle className="text-green-500 w-12 h-12" />
                                </motion.div>

                                {/* Tiêu đề */}
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        Cảm ơn bạn đã gửi báo cáo!
                                    </h2>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">
                                        Chúng tôi sẽ xem xét và xử lý nội dung này theo{" "}
                                        <span className="text-blue-500 cursor-pointer hover:underline">
                                            Tiêu chuẩn cộng đồng
                                        </span>
                                        . Báo cáo của bạn giúp nền tảng trở nên an toàn hơn 💙
                                    </p>
                                </div>

                                {/* Nút hành động */}
                                <div className="w-full border-t border-b border-gray-200 dark:border-neutral-700 ">
                                    <button className="w-full py-3 font-medium text-red-500 border border-transparent hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                                        🚫 Chặn người đăng bài này
                                    </button>   
                                </div>
                                {/* Nút đóng */}
                                <motion.button
                                    onClick={onClose}
                                    whileTap={{ scale: 0.95 }}
                                    className=" bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-50 py-2 font-semibold shadow-md transition"
                                >
                                    Đóng
                                </motion.button>
                            </div>

                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
