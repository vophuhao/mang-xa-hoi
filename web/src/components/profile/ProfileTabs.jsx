import { Bookmark, Grid3X3, UserCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const ProfileTabs = ({ activeTab, isOwnProfile }) => {
  const navigate = useNavigate();
  const { username } = useParams();
  const tabs = [
    {
      id: "posts",
      label: "BÀI VIẾT",
      icon: Grid3X3,
      count: null,
    },
    ...(isOwnProfile
      ? [
          {
            id: "saved",
            label: "ĐÃ LƯU",
            icon: Bookmark,
            count: null,
          },
        ]
      : []),
    {
      id: "tagged",
      label: "ĐƯỢC GẮN THẺ",
      icon: UserCheck,
      count: null,
    },
  ];

  return (
    <div className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "posts") {
                    navigate(`/${username}`);
                  } else {
                    navigate(`/${username}/${tab.id}`);
                  }
                }}
                className={`flex flex-1 items-center justify-center space-x-2 py-4 text-xs font-semibold tracking-wide uppercase ${
                  activeTab === tab.id
                    ? "border-t-2 border-gray-900 text-gray-900 dark:border-white dark:text-white"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== null && <span className="ml-1">({tab.count})</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileTabs;
