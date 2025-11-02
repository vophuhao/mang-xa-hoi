import { useState } from "react";

import { Plus } from "lucide-react";

import CreateHighlightModal from "@/components/story/CreateHighlightModal";
import StoryViewer from "@/components/story/StoryViewer";

const ProfileStoryHighlights = ({
  highlights = [],
  userStories = [],
  isOwnProfile,
  onAddHighlight,
  onViewHighlight,
  currentUserId,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState(null);

  if (!highlights.length && !isOwnProfile) {
    return null;
  }

  const handleViewHighlight = (highlight) => {
    // Convert highlight to story viewer format
    const highlightStories = highlight.stories.map((story) => ({
      ...story,
      user: {
        _id: story.user?._id || story.user || currentUserId,
        username: highlight.username || "You",
        avatarUrl: story.user?.avatarUrl || highlight.avatarUrl,
        userId: highlight.userId,
        isVerified: highlight.isVerified,
      },
    }));

    setSelectedHighlight({
      userStories: [
        {
          user: {
            _id: currentUserId,
            username: highlight.username || "You",
            avatarUrl: highlight.avatarUrl,
            userId: highlight.userId,
            isVerified: highlight.isVerified,
          },
          stories: highlightStories,
          hasUnviewed: false,
        },
      ],
      initialUserIndex: 0,
      initialStoryIndex: 0,
    });
    setShowStoryViewer(true);
    onViewHighlight?.(highlight);
  };

  const handleAddHighlight = () => {
    setShowCreateModal(true);
    onAddHighlight?.();
  };

  const handleViewCurrentStories = () => {
    if (!userStories || userStories.length === 0) return;

    // userStories from profile is array of stories, not grouped by user
    // Convert to StoryViewer format
    const firstStory = userStories[0];
    if (!firstStory?.user) {
      console.error("Invalid story format: missing user data");
      return;
    }

    setSelectedHighlight({
      userStories: [
        {
          user: firstStory.user, // All stories have same user in profile context
          stories: userStories,
          hasUnviewed: false,
        },
      ],
      initialUserIndex: 0,
      initialStoryIndex: 0,
    });
    setShowStoryViewer(true);
  };

  // Check if user has active current stories
  const hasCurrentStories = userStories && userStories.length > 0;

  return (
    <div className="bg-white p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="scrollbar-hide flex space-x-6 overflow-x-auto pt-2 pb-2">
          {/* Current Active Stories - Show first if user has active stories */}
          {hasCurrentStories && (
            <button
              onClick={handleViewCurrentStories}
              className="group flex flex-shrink-0 flex-col items-center space-y-2"
            >
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-[2px] transition-all group-hover:from-purple-600 group-hover:to-pink-600">
                  <div className="h-full w-full rounded-full bg-white p-[2px] dark:bg-gray-800">
                    {(userStories[0]?.mediaUrl || userStories[0]?.user?.avatarUrl)?.toLowerCase().endsWith(".mp4") ? (
                      <video
                        src={userStories[0]?.mediaUrl || userStories[0]?.user?.avatarUrl}
                        className="h-full w-full rounded-full object-cover"                 
                      />
                    ) : (
                      <img
                        src={userStories[0]?.mediaUrl || userStories[0]?.user?.avatarUrl}
                        alt="Current Story"
                        className="h-full w-full rounded-full object-cover"
                      />
                    )}

                  </div>
                </div>
                {/* Story count badge */}
                {userStories.length > 1 && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {userStories.length}
                  </div>
                )}
              </div>
              <span className="max-w-16 truncate text-[9px] font-medium text-gray-900 dark:text-white">
                Story hiện tại
              </span>
            </button>
          )}
          {/* Existing Highlights */}
          {highlights.map((highlight, index) => (
            <button
              key={highlight.id || index}
              onClick={() => handleViewHighlight(highlight)}
              className="group flex flex-shrink-0 flex-col items-center space-y-2 pl-1"
            >
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-gray-200 transition-all group-hover:ring-gray-300 dark:ring-gray-700 dark:group-hover:ring-gray-600">
                  <img
                    src={highlight.thumbnail}
                    alt={highlight.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              </div>
              <span className="max-w-16 truncate text-xs font-medium text-gray-900 dark:text-white">
                {highlight.title}
              </span>
            </button>
          ))}

          {/* Add New Highlight - Only for own profile */}
          {isOwnProfile && (
            <button
              onClick={handleAddHighlight}
              className="group flex flex-shrink-0 flex-col items-center space-y-2"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gray-300 transition-all group-hover:border-gray-400 dark:border-gray-600 dark:group-hover:border-gray-500">
                <Plus className="h-6 w-6 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                Nổi bật mới
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Create Highlight Modal */}
      {isOwnProfile && (
        <CreateHighlightModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      )}

      {/* Story Viewer for Highlights */}
      {showStoryViewer && selectedHighlight && (
        <StoryViewer
          isOpen={showStoryViewer}
          onClose={() => setShowStoryViewer(false)}
          userStories={selectedHighlight.userStories}
          initialUserIndex={selectedHighlight.initialUserIndex}
          initialStoryIndex={selectedHighlight.initialStoryIndex}
          currentUserId={currentUserId}
          isProfileView={true}
        />
      )}
    </div>
  );
};

export default ProfileStoryHighlights;
