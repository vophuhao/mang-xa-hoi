import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { mutate: createAccount, isPending, isError, error } = useMutation({
    mutationFn: register,
    onSuccess: () => {
      setIsOpen(true); // mở popup khi thành công
    },
  });

  const handleConfirm = () => {
    setIsOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create an account
        </h2>

        {isError && (
          <div className="mb-4 text-red-500 text-sm">
            {error?.message || "An error occurred"}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
            />
            <p className="text-xs text-gray-500 mt-1">
              - Must be at least 6 characters long.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                createAccount({ email, password, confirmPassword })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <button
            disabled={
              isPending ||
              !email ||
              password.length < 6 ||
              password !== confirmPassword
            }
            onClick={() => createAccount({ email, password, confirmPassword })}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Account"}
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Popup */}
      {isOpen && (
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
