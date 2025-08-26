import { useState } from "react";

import { GoogleLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import landingImg_1 from "../assets/images/landingImg_1.png";
import Divider from "../components/ui/Divider";
import FloatingInput from "../components/ui/FloatingInput";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { googleLogin } from "../lib/api";
import { loginUser } from "../store/slices/authSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const redirectUrl = location.state?.redirectUrl || "/";
  const { isDarkMode, toggleTheme } = useTheme();

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const credential = credentialResponse.credential;
      await googleLogin({ credential });
      navigate("/home"); // hoặc navigate("/dashboard") tùy dự án của bạn
    } catch (error) {
      navigate("/login"); // chỉ quay về login nếu lỗi
    }
  };

  const handleSubmit = () => {
    dispatch(loginUser({ email, password })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        navigate(redirectUrl, { replace: true });
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[1.5px]"
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
          {/* Login Form Card */}
          <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
            {/* Header */}
            <div className="mb-10 text-center">
              <h1 className="font-pacifico text-4xl font-bold text-gray-800 lg:text-5xl dark:text-white">
                Hi! It&apos;s Pixyy
              </h1>
            </div>

            {/* Error Message */}
            {error && (
              <span className="mb-4 block text-center text-red-600 dark:text-red-400">
                {error}
              </span>
            )}

            {/* Form */}
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
                onKeyDown={handleKeyDown}
                label="Mật khẩu"
                required
                showPasswordToggle
              />

              <div className="text-right">
                <Link
                  to="/password/forgot"
                  className="font-boldtransition-colors text-sm text-pink-400 duration-300 hover:text-pink-600 dark:text-red-200 dark:hover:text-red-300"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Divider */}
              <Divider text="hoặc" />

              {/* Google Login Button */}
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => toast.error("Đăng nhập thất bại")}
                useOneTap
              />

              {/* Login Button */}
              <button
                type="submit"
                disabled={!email || password.length < 6 || isLoading}
                onClick={handleSubmit}
                className="w-full transform rounded-2xl bg-gradient-to-r from-pink-300 to-red-400 px-4 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-pink-400 hover:to-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    <span>Đang đăng nhập...</span>
                  </div>
                ) : (
                  "Đăng nhập"
                )}
              </button>

              {/* Sign up link */}
              <div className="mt-6 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Bạn chưa có tài khoản?{" "}
                  <Link
                    to="/register"
                    className="font-bold text-pink-400 transition-colors duration-300 hover:text-pink-600 dark:text-red-200 dark:hover:text-red-300"
                  >
                    Đăng ký
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
