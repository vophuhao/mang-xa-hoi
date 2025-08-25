import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from "react-router-dom";
import landingImg_1 from "../assets/images/landingImg_1.png";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import Divider from "../components/ui/Divider";
import GoogleIcon from "../components/ui/GoogleIcon";
import FloatingInput from "../components/ui/FloatingInput";
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
    alert('Google login clicked');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
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
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 lg:px-12">
        <div className="w-full max-w-md">
          {/* Register Form Card */}
          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-6 font-pacifico">
                Pixyy
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-bold mx-10">
                Đăng ký để có trải nghiệm tốt nhất với Pixyy.
              </p>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-4 px-4 bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 rounded-2xl text-gray-700 dark:text-gray-100 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <GoogleIcon />
              <span>Đăng nhập bằng Google</span>
            </button>

            {/* Divider */}
            <Divider text="hoặc" />

            {/* Error Message */}
            {error && (
              <span className="block text-center mb-4 text-red-600 dark:text-red-400">
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
                className="w-full py-4 px-4 bg-gradient-to-r from-pink-300 to-red-400 hover:from-pink-400 hover:to-red-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Đang đăng ký...</span>
                  </div>
                ) : (
                  "Đăng ký"
                )}
              </button>

              {/* Sign in link */}
              <div className="text-center mt-6">
                <span className="text-gray-600 dark:text-gray-300 text-sm">
                  Bạn đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-pink-400 dark:text-red-200 hover:text-pink-600 dark:hover:text-red-300 transition-colors duration-300"
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
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Đăng ký thành công
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Vui lòng kiểm tra email để xác thực tài khoản.
            </p>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
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