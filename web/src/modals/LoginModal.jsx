import { useEffect, useState } from "react";

import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import ErrorAlertWithAutoClose from "@/components/ui/ErrorAlertWithAutoClose";
import FloatingInput from "@/components/ui/FloatingInput";
import { getUser } from "@/lib/api";
import { loginUser } from "@/store/slices/authSlice";
import { saveAccount } from "@/utils/accountStorage";

export default function LoginModal({ isOpen, onClose, initialEmail = "" }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  // Update email when initialEmail changes
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setPassword(""); // Reset password when modal opens
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      const { meta } = await dispatch(loginUser({ email, password }));
      if (meta.requestStatus === "fulfilled") {
        // Fetch user data để lấy thông tin đầy đủ
        try {
          const response = await getUser();

          // Lưu tài khoản vào localStorage
          if (response?.data) {
            saveAccount({
              userId: response.data._id,
              email: response.data.email,
              username: response.data.username,
              avatarUrl: response.data.avatarUrl,
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Nếu không fetch được, lưu với email làm fallback
          saveAccount({
            userId: email, // fallback
            email,
            username: email.split("@")[0],
            avatarUrl: null,
          });
        }

        // Reload page để cập nhật user context
        window.location.reload();
        onClose();
      }
    } catch (error) {
      console.error("Login failed:", error.message || error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Đóng"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-pacifico mb-2 text-4xl font-normal tracking-tight text-black dark:text-white">
            Pixyy
          </h1>
          <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
            Đăng nhập vào tài khoản khác
          </p>
        </div>

        {/* Error Alert */}
        {error && <ErrorAlertWithAutoClose message={error} />}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <FloatingInput
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email"
            required
            onKeyDown={handleKeyDown}
          />

          {/* Password Input */}
          <FloatingInput
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Mật khẩu"
            required
            showPasswordToggle
            onKeyDown={handleKeyDown}
          />

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="hover:bg-primary/90 focus:ring-ring w-full rounded-full bg-blue-500 py-3 font-semibold text-white transition-all duration-300 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
