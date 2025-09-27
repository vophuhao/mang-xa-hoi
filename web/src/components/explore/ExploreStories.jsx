import { useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

const EXPLORE_STORIES = [
  {
    id: 1,
    title: "Food",
    thumbnail:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=150&h=150&fit=crop&crop=face",
    color: "from-orange-400 to-pink-500",
  },
  {
    id: 2,
    title: "Travel",
    thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=150&h=150&fit=crop",
    color: "from-purple-500 to-blue-500",
  },
  {
    id: 3,
    title: "Art",
    thumbnail: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=150&h=150&fit=crop",
    color: "from-pink-500 to-purple-600",
  },
  {
    id: 4,
    title: "Fashion",
    thumbnail:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150&h=150&fit=crop&crop=face",
    color: "from-indigo-500 to-pink-500",
  },
  {
    id: 5,
    title: "Nature",
    thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop",
    color: "from-green-400 to-blue-500",
  },
  {
    id: 6,
    title: "Fitness",
    thumbnail:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face",
    color: "from-red-500 to-orange-500",
  },
  {
    id: 7,
    title: "Tech",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop",
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: 8,
    title: "Music",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop",
    color: "from-purple-600 to-pink-500",
  },
];

const ExploreStories = () => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const containerRef = useRef(null);

  const checkScrollButtons = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="relative mb-6">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Stories Container */}
      <div
        ref={containerRef}
        className="scrollbar-hide flex space-x-4 overflow-x-auto pb-2"
        onScroll={checkScrollButtons}
      >
        {EXPLORE_STORIES.map((story) => (
          <div key={story.id} className="group flex-shrink-0 cursor-pointer">
            <div className="flex flex-col items-center space-y-2">
              {/* Story Ring */}
              <div className={`rounded-full bg-gradient-to-tr ${story.color} p-0.5`}>
                <div className="rounded-full bg-white p-0.5 dark:bg-gray-900">
                  <img
                    src={story.thumbnail}
                    alt={story.title}
                    className="h-14 w-14 rounded-full object-cover transition-transform group-hover:scale-105 sm:h-16 sm:w-16"
                  />
                </div>
              </div>

              {/* Story Title */}
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {story.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreStories;
