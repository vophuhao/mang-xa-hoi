import useAuth from "../hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();
  const { email, verified, createdAt } = user;
  return (
    <div className="mt-16 flex flex-col items-center">
      <h1 className="mb-4 text-2xl font-bold">My Account</h1>
      {!verified && (
        <div className="mb-3 flex items-center rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Please verify your email
        </div>
      )}
      <p className="mb-2 text-white">
        Email: <span className="text-gray-300">{email}</span>
      </p>
      <p className="text-white">
        Created on{" "}
        <span className="text-gray-300">
          {new Date(createdAt).toLocaleDateString("en-US")}
        </span>
      </p>
    </div>
  );
};
export default Profile;
