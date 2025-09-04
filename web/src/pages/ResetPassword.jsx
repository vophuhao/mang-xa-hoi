import { Link, useSearchParams } from "react-router-dom";

import ResetPasswordForm from "../components/ResetPasswordForm";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const exp = Number(searchParams.get("exp"));
  const now = Date.now();
  const linkIsValid = code && exp && exp > now;

  return (
    <div className="flex min-h-screen justify-center">
      <div className="mx-auto max-w-md px-6 py-12 text-center">
        {linkIsValid ? (
          <ResetPasswordForm code={code} />
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              <svg
                className="mr-2 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Invalid Link
            </div>
            <p className="text-gray-400">
              The link is either invalid or expired.
            </p>
            <Link
              to="/password/forgot"
              replace
              className="text-blue-500 underline hover:text-blue-700"
            >
              Request a new password reset link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
export default ResetPassword;
