import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import landingImg_1 from "../assets/images/landingImg_1.png";
import Divider from "../components/ui/Divider";
import FloatingInput from "../components/ui/FloatingInput";
import GoogleIcon from "../components/ui/GoogleIcon";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { registerUser, resetRegistered } from "../store/slices/authSlice";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, isRegistered } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { isDarkMode, toggleTheme } = useTheme();

  const handleConfirm = () => {
    dispatch(resetRegistered());
    navigate("/login", { replace: true });
  };

  const handleSubmit = () => {
    dispatch(registerUser({ email, password, confirmPassword }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleGoogleLogin = () => {
    alert("Google login clicked");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${landingImg_1})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-pink-200/20 to-orange-200/20"></div>
      </div>

      {/* Theme Toggle Button */}
      <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 lg:px-12">
        <div className="w-full max-w-md">
          {/* Register Form Card */}
          <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
            {/* Header */}
            <div className="mb-4 text-center">
              <h1 className="font-pacifico mb-6 text-4xl font-bold text-gray-800 lg:text-5xl dark:text-white">
                Pixyy
              </h1>
              <p className="mx-10 text-lg font-bold text-gray-600 dark:text-gray-300">
                Đăng ký để có trải nghiệm tốt nhất với Pixyy.
              </p>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center space-x-3 rounded-2xl border border-white/30 bg-white/20 px-4 py-4 text-gray-700 transition-all duration-300 hover:bg-white/30 dark:border-white/20 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20"
            >
              <GoogleIcon />
              <span>Đăng nhập bằng Google</span>
            </button>

            {/* Divider */}
            <Divider text="hoặc" />

            {/* Error Message */}
            {error && (
              <span className="mb-4 block text-center text-red-600 dark:text-red-400">
                {error}
              </span>
            )}

            <div className="space-y-6">
              <FloatingInput
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Email"
                required
              />

              <FloatingInput
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Mật khẩu"
                required
                showPasswordToggle
              />

              <FloatingInput
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                label="Xác nhận mật khẩu"
                required
                showPasswordToggle
              />

              {/* Register Button */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  !email ||
                  password.length < 6 ||
                  password !== confirmPassword
                }
                onClick={handleSubmit}
                className="w-full transform rounded-2xl bg-gradient-to-r from-pink-300 to-red-400 px-4 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-pink-400 hover:to-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    <span>Đang đăng ký...</span>
                  </div>
                ) : (
                  "Đăng ký"
                )}
              </button>

              {/* Sign in link */}
              <div className="mt-6 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Bạn đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-pink-400 transition-colors duration-300 hover:text-pink-600 dark:text-red-200 dark:hover:text-red-300"
                  >
                    Đăng nhập
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup */}
      {isRegistered && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-lg">
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              Đăng ký thành công
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Vui lòng kiểm tra email để xác thực tài khoản.
            </p>
            <button
              onClick={handleConfirm}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white shadow hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
