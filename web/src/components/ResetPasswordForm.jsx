import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { resetPassword } from "../lib/api";

const ResetPasswordForm = ({ code }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const {
    mutate: resetUserPassword,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: resetPassword,
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-lg shadow p-8">
        <div className="flex justify-center mb-6">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
            alt="logo"
            className="w-12 h-12"
          />
        </div>

        <h2 className="text-center text-lg font-semibold mb-2">
          Trouble logging in?
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Enter your new password below to reset your account.
        </p>

        {isError && (
          <div className="mb-3 text-red-500 text-sm">
            {error.message || "An error occurred"}
          </div>
        )}

        {isSuccess ? (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 py-2 px-3 rounded mb-3">
              Password updated successfully!
            </div>
            <Link to="/login" replace className="text-blue-500 font-medium">
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-3 px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            />
            <button
              disabled={
                password.length < 6 || password !== confirmPassword || isPending
              }
              onClick={() =>
                resetUserPassword({
                  password,
                  verificationCode: code,
                })
              }
              className={`w-full py-2 rounded font-semibold text-white ${
                password.length >= 6 && password === confirmPassword
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              {isPending ? "Resetting..." : "Reset Password"}
            </button>

            <div className="text-center mt-4">
              <Link to="/login" replace className="text-blue-500 text-sm">
                Back to Login
              </Link>
            </div>

            <hr className="my-5" />

            <div className="text-center text-sm">
              Don’t have an account?{" "}
              <Link to="/signup" className="text-blue-500 font-medium">
                Sign up
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordForm;
