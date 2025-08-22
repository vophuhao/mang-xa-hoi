import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "../lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const {
    mutate: sendPasswordReset,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: sendPasswordResetEmail,
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white border rounded-lg shadow-sm">
        {/* Logo (bạn thay ảnh logo Instagram nếu muốn) */}
        <div className="flex justify-center mb-6">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
            alt="Logo"
            className="h-12"
          />
        </div>

        <h2 className="text-xl font-semibold text-center mb-4">
          Trouble logging in?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your email and we’ll send you a link to get back into your account.
        </p>

        {isError && (
          <p className="text-red-500 text-sm mb-3">
            {error.message || "An error occurred"}
          </p>
        )}

        {isSuccess ? (
          <div className="p-3 mb-4 text-sm text-green-600 bg-green-100 rounded-md">
            Email sent! Check your inbox for further instructions.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPasswordReset(email);
            }}
          >
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-400 mb-4"
              required
            />
            <button
              type="submit"
              disabled={!email || isPending}
              className="w-full py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Send login link"}
            </button>
          </form>
        )}

        <div className="flex justify-center mt-6">
          <Link
            to="/login"
            className="text-blue-500 text-sm font-medium hover:underline"
          >
            Back to Login
          </Link>
        </div>

        <div className="border-t mt-6 pt-4 text-center">
          <p className="text-sm">
            Don’t have an account?{" "}
            <Link to="/register" className="font-medium text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
