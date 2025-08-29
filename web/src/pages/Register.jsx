import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import BackgroundImage from "../components/ui/BackgroundImage";
import Divider from "../components/ui/Divider";
import ErrorAlertWithAutoClose from "../components/ui/ErrorAlertWithAutoClose";
import FloatingInput from "../components/ui/FloatingInput";
import GoogleLoginButton from "../components/ui/GoogleLoginButton";
import ThemeToggle from "../components/ui/ThemeToggle";
import { registerUser, resetRegistered } from "../store/slices/authSlice";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, isRegistered } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleConfirm = () => {
    dispatch(resetRegistered());
    navigate("/login", { replace: true });
  };

  const handleSubmit = () => {
    dispatch(registerUser({ email, name, password, confirmPassword }));
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
          {/* Register Form Card */}
          <div className="bg-card/20 border-border rounded-3xl border px-8 py-4 shadow-2xl backdrop-blur-sm">
            {/* Header */}
            <div className="mb-4 text-center">
              <h1 className="font-pacifico text-card-foreground mb-6 text-4xl font-bold lg:text-5xl">
                Pixyy
              </h1>
              <p className="text-card-foreground/70 mx-10 text-lg font-bold">
                Đăng ký để có trải nghiệm tốt nhất với Pixyy.
              </p>
            </div>

            {/* Google Login Button */}
            <GoogleLoginButton />

            {/* Divider */}
            <Divider text="hoặc" />

            {/* Error Message */}
            {error && <ErrorAlertWithAutoClose message={error} />}

            <div className="space-y-4">
              <FloatingInput
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Email"
                required
              />

              <FloatingInput
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                label="Tên người dùng"
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
              <div className="mt-4 text-center">
                <span className="text-muted-foreground text-sm">
                  Bạn đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="hover:text-accent-foreground text-foreground font-bold underline transition-colors duration-300"
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
