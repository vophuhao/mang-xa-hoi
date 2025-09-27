import { useState } from "react";

import ExploreGrid from "@/components/explore/ExploreGrid";
import ExploreHeader from "@/components/explore/ExploreHeader";
import PostModal from "@/components/feed/PostModal";

const Explore = () => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleQuickAction = (action) => {
    // Handle quick actions like create, search, etc.
    console.log("Quick action:", action);
    switch (action) {
      case "search":
        // Focus search input
        break;
      case "trending":
        setSearchQuery("");
        break;
      case "create":
        // Open create post modal
        break;
      case "people":
        setSearchQuery("@");
        break;
      case "reels":
        // Navigate to reels
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-20">
        {/* Header with Search */}
        <ExploreHeader onSearch={handleSearch} />

        {/* Stories Section - Only show when not searching */}
        {/* {!searchQuery && <ExploreStories />} */}

        {/* Quick Actions - Only show when not searching */}
        {/* {!searchQuery && <ExploreQuickActions onActionClick={handleQuickAction} />} */}

        {/* Suggested Hashtags - Only show when not searching */}
        {/* {!searchQuery && <ExploreSuggestions onHashtagClick={handleSearch} />} */}

        {/* Posts Grid */}
        <ExploreGrid searchQuery={searchQuery} onPostClick={handlePostClick} />

        {/* Post Modal */}
        {selectedPost && (
          <PostModal post={selectedPost} isOpen={!!selectedPost} onClose={handleCloseModal} />
        )}
      </div>
    </div>
  );
};

export default Explore;
