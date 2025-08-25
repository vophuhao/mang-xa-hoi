import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { verifyEmail } from "../lib/api";

const VerifyEmail = () => {
  const { code } = useParams();
  const { isPending, isSuccess, isError } = useQuery({
    queryKey: ["emailVerification", code],
    queryFn: () => verifyEmail(code),
  });

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
              {isSuccess ? "Email Verified!" : "Verification Failed"}
            </h2>

            <div
              className={`flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium ${
                isSuccess
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {isSuccess
                ? "Your email has been successfully verified."
                : "Invalid or expired verification link."}
            </div>

            {isError && (
              <p className="text-sm text-gray-600">
                The link is either invalid or expired.{" "}
                <Link
                  to="/password/forgot"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Get a new link
                </Link>
              </p>
            )}

            <Link
              to="/login"
              className="block w-full rounded-md bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 transition"
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
