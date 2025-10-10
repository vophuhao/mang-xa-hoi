import { useState } from "react";

import { Bookmark, Folder, Grid3X3 } from "lucide-react";

import CollectionsGrid from "@/components/collection/CollectionsGrid";
import { useCurrentUser } from "@/hooks/useUser";

const SavedPosts = () => {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "collections"
  const { data: userResponse } = useCurrentUser();
  const user = userResponse?.data;

  const handleCollectionClick = (collection) => {
    // Navigate to collection detail view
    console.log("Navigate to collection:", collection);
    // TODO: Implement navigation to collection detail page
  };

  const tabs = [
    {
      id: "all",
      label: "All Posts",
      icon: Grid3X3,
    },
    {
      id: "collections",
      label: "Collections",
      icon: Folder,
    },
  ];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center space-x-3">
          <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
            <Bookmark className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Posts</h1>
            <p className="text-gray-500 dark:text-gray-400">Your saved posts and collections</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center space-x-2 rounded-md px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "all" && (
          <div>
            {/* TODO: Implement saved posts grid */}
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Bookmark className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                No saved posts yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">Posts you save will appear here</p>
            </div>
          </div>
        )}

        {activeTab === "collections" && (
          <CollectionsGrid onCollectionClick={handleCollectionClick} />
        )}
      </div>
    </div>
  );
};

export default SavedPosts;
