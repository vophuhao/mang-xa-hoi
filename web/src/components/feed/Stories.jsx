import { useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

const Stories = ({ stories = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  const STORIES_PER_SCROLL = 5;
  const STORY_WIDTH = 80; // 64px story + 16px gap

  // Create data to work with (stories or placeholders)
  const allStories =
    stories.length > 0
      ? stories
      : Array.from({ length: 20 }, (_, i) => ({
          user: { _id: `placeholder-${i}`, username: `user${i + 1}`, avatarUrl: null },
        }));

  const totalStories = allStories.length;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = Math.max(0, currentIndex - STORIES_PER_SCROLL);
      setCurrentIndex(newIndex);

      if (scrollContainerRef.current) {
        const scrollDistance = newIndex * STORY_WIDTH;
        scrollContainerRef.current.scrollTo({
          left: scrollDistance,
          behavior: "smooth",
        });
      }
    }
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, totalStories - STORIES_PER_SCROLL);
    if (currentIndex < maxIndex) {
      const newIndex = Math.min(maxIndex, currentIndex + STORIES_PER_SCROLL);
      setCurrentIndex(newIndex);

      if (scrollContainerRef.current) {
        const scrollDistance = newIndex * STORY_WIDTH;
        scrollContainerRef.current.scrollTo({
          left: scrollDistance,
          behavior: "smooth",
        });
      }
    }
  };

  // Show navigation if there are more stories than can fit in 5 visible slots + 2 partial
  const showNavigation = totalStories >= 7;

  const handleStoryClick = (story) => {
    // TODO: Open story viewer
    console.log("Story clicked:", story);
  };

  return (
    <div className="mb-6 bg-transparent">
      <div className="relative">
        {/* Stories Container with overflow and padding for partial visibility */}
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex gap-4 overflow-x-hidden pt-4 pr-[32px] pl-[32px]"
        >
          {/* Stories */}
          {allStories.map((story, index) => (
            <div
              key={story.user._id || `story-${index}`}
              className="flex w-[64px] flex-shrink-0 flex-col items-center"
            >
              <button
                onClick={() => handleStoryClick(story)}
                className="mb-1 h-16 w-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-[2px] transition-transform hover:scale-105"
              >
                <div className="h-full w-full rounded-full bg-white p-[2px] dark:bg-gray-800">
                  {story.user.avatarUrl ? (
                    <img
                      src={story.user.avatarUrl}
                      alt={story.user.username}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>
              </button>
              <span className="max-w-16 truncate text-xs text-gray-700 dark:text-gray-300">
                {story.user.username}
              </span>
            </div>
          ))}
        </div>

        {/* Navigation Buttons - only show if there are stories that get cut off */}
        {showNavigation && (
          <>
            {/* Previous Button */}
            {currentIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="absolute top-8 left-1 z-10 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:scale-110 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}

            {/* Next Button */}
            {currentIndex + STORIES_PER_SCROLL < totalStories && (
              <button
                onClick={handleNext}
                className="absolute top-8 right-1 z-10 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:scale-110 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
              >
                <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Stories;
