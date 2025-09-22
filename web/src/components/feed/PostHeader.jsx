import { MoreHorizontal } from "lucide-react";

const PostHeader = ({ user, location, onOptionsClick }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        {/* User Avatar */}
        <div className="mr-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600" />
          )}
        </div>

        {/* User Info */}
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {user?.username}
            </span>
            {user?.isVerified && (
              <svg className="ml-1 h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          {location && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{location.name}</span>
          )}
        </div>
      </div>

      {/* Options Button */}
      <button
        onClick={onOptionsClick}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <MoreHorizontal size={20} />
      </button>
    </div>
  );
};

export default PostHeader;
