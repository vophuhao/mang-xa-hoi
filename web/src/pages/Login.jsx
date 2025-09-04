import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

import BackgroundImage from "@/components/ui/BackgroundImage";
import Divider from "@/components/ui/Divider";
import ErrorAlertWithAutoClose from "@/components/ui/ErrorAlertWithAutoClose";
import FloatingInput from "@/components/ui/FloatingInput";
import GoogleLoginButton from "@/components/ui/GoogleLoginButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { loginUser } from "@/store/slices/authSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const redirectUrl = location.state?.redirectUrl || "/";

  const handleSubmit = async () => {
    try {
      const { meta } = await dispatch(loginUser({ email, password }));
      if (meta.requestStatus === "fulfilled") {
        navigate(redirectUrl, { replace: true });
      }
    } catch (error) {
      console.error("Login failed:", error.message || error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <BackgroundImage />

      {/* Theme Toggle Button */}
      <ThemeToggle />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 lg:px-12">
        <div className="w-full max-w-md">
          {/* Login Form Card */}
          <div className="bg-card/20 border-border rounded-3xl border p-8 shadow-2xl backdrop-blur-sm">
            {/* Header */}
            <div className="mb-10 text-center">
              <h1 className="font-pacifico text-card-foreground text-4xl font-bold lg:text-5xl">
                Hi! It&apos;s Pixyy
              </h1>
            </div>

            {/* Error Message */}
            {error && <ErrorAlertWithAutoClose message={error} />}

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
                  className="hover:text-accent-foreground text-foreground text-sm font-bold transition-colors duration-300"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Divider */}
              <Divider text="hoặc" />

              {/* Google Login Button */}
              <GoogleLoginButton />

              {/* Login Button */}
              <button
                type="submit"
                disabled={!email || password.length < 6 || isLoading}
                onClick={handleSubmit}
                className="w-full transform rounded-2xl bg-gradient-to-r from-pink-300 to-red-400 px-4 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-pink-400 hover:to-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-600"
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
                <span className="text-muted-foreground text-sm">
                  Bạn chưa có tài khoản?{" "}
                  <Link
                    to="/register"
                    className="hover:text-accent-foreground text-foreground font-bold underline transition-colors duration-300"
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
