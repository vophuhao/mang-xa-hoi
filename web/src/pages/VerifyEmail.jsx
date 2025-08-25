import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { verifyEmail, sendEmailVerification } from "../lib/api";
import { useState } from "react";

const VerifyEmail = () => {
  const { code } = useParams();
  const { isPending, isSuccess, isError } = useQuery({
    queryKey: ["emailVerification", code],
    queryFn: () => verifyEmail(code),
  });

  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    try {
      setLoading(true);
      await sendEmailVerification(email);
      setEmailSent(true);
    } catch (err) {
      console.error(err);
      alert("Failed to send verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
        {isPending ? (
          <div className="flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              {isSuccess ? "Email Verified!" : "Verification"}
            </h2>

            {/* Nếu verify success thì hiển thị alert xanh */}
            {isSuccess && (
              <div className="flex items-center justify-center gap-2 rounded-md bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
                Your email has been successfully verified.
              </div>
            )}

            {/* Nếu verify fail mà chưa gửi email thì hiển thị alert đỏ */}
            {isError && !emailSent && (
              <div className="flex items-center justify-center gap-2 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                Invalid or expired verification link.
              </div>
            )}

            {/* Nếu verify fail và chưa gửi email thì hiển thị form */}
            {isError && !emailSent && (
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <label className="block text-sm font-medium text-gray-700">
                  Enter your email to get a new link
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm focus:ring focus:ring-blue-500"
                  placeholder="you@example.com"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Get a new link"}
                </button>
              </form>
            )}

            {/* Thông báo gửi email thành công */}
            {emailSent && (
              <p className="text-sm text-green-600">
                A new verification email has been sent. Please check your inbox.
              </p>
            )}

            <Link
              to="/login"
              className="block w-full rounded-md bg-gray-600 py-2 text-white font-medium hover:bg-gray-700 transition"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
