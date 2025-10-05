import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MoreHorizontal,
  Pause,
  Play,
  Send,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { useLikeStory, useStories, useStoryActions } from "@/hooks/useStory";

import StoryLikesModal from "./StoryLikesModal";
import StoryProgressBar from "./StoryProgressBar";

const StoryViewer = ({
  isOpen,
  onClose,
  userStories = [],
  initialStoryIndex = 0,
  initialUserIndex = 0,
  currentUserId,
  isProfileView = false, // New prop to distinguish profile vs feed view
}) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [wasPlayingBeforeModal, setWasPlayingBeforeModal] = useState(false);

  const videoRef = useRef(null);
  const viewedStoriesRef = useRef(new Set()); // Track viewed stories to prevent duplicates
  const lastLikeTimeRef = useRef(0); // Rate limiting for likes
  const pendingViewRef = useRef(false); // Prevent concurrent view requests
  const { viewStory } = useStoryActions();
  const likeStoryMutation = useLikeStory();

  // Get fresh data from React Query cache for feed view only
  const { data: freshUserStories = [] } = useStories();

  // Use different data sources based on view type
  const activeUserStories = useMemo(() => {
    if (isProfileView) {
      // For profile view, always use props (specific user's stories)
      return userStories;
    }
    // For feed view, use fresh cache data with fallback to props
    return freshUserStories.length > 0 ? freshUserStories : userStories;
  }, [isProfileView, freshUserStories, userStories]);

  const currentUserStories = activeUserStories[currentUserIndex] || { stories: [], user: null };
  const currentStory = currentUserStories.stories[currentStoryIndex];
  const isVideo = currentStory?.mediaType === "video";
  const isOwner = currentStory?.user?._id === currentUserId;

  // Ensure indexes are valid when cache updates
  useEffect(() => {
    if (currentUserIndex >= activeUserStories.length && activeUserStories.length > 0) {
      setCurrentUserIndex(0);
      setCurrentStoryIndex(0);
    } else if (
      currentStoryIndex >= currentUserStories.stories.length &&
      currentUserStories.stories.length > 0
    ) {
      setCurrentStoryIndex(0);
    }
  }, [
    activeUserStories.length,
    currentUserStories.stories.length,
    currentUserIndex,
    currentStoryIndex,
  ]);

  // Reset pause state and ensure auto-play when story changes
  useEffect(() => {
    if (currentStory) {
      setIsPaused(false); // Always resume when changing stories

      // For videos, ensure they play after a short delay to allow loading
      if (isVideo && videoRef.current) {
        const playTimer = setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        }, 100);

        return () => clearTimeout(playTimer);
      }
    }
  }, [currentStory, isVideo]);

  // Get current like status from story data (always fresh from cache)
  const isCurrentStoryLiked = currentStory?.isLiked || false;

  // Handle story progression
  const nextStory = useCallback(() => {
    const totalStoriesInUser = currentUserStories.stories.length;

    if (currentStoryIndex < totalStoriesInUser - 1) {
      // Next story in same user
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentUserIndex < activeUserStories.length - 1) {
      // Next user
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      // End of all stories
      onClose();
    }
  }, [
    currentStoryIndex,
    currentUserIndex,
    currentUserStories.stories.length,
    activeUserStories.length,
    onClose,
  ]);

  const prevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Previous story in same user
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentUserIndex > 0) {
      // Previous user
      const prevUserIndex = currentUserIndex - 1;
      const prevUserStories = activeUserStories[prevUserIndex];
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryIndex(prevUserStories.stories.length - 1);
    }
  }, [currentStoryIndex, currentUserIndex, activeUserStories]);

  // Mark story as viewed with debouncing and duplicate prevention
  useEffect(() => {
    if (!currentStory || isOwner || !isOpen || pendingViewRef.current) return;

    const storyId = currentStory._id;

    // Prevent duplicate view requests
    if (viewedStoriesRef.current.has(storyId)) return;

    // Add debounce to prevent excessive requests
    const viewTimer = setTimeout(async () => {
      pendingViewRef.current = true;
      try {
        viewedStoriesRef.current.add(storyId);
        await viewStory(storyId);
      } finally {
        pendingViewRef.current = false;
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(viewTimer);
  }, [currentStory, isOwner, isOpen, viewStory]);

  // Clear viewed stories when component unmounts or closes
  useEffect(() => {
    if (!isOpen) {
      viewedStoriesRef.current.clear();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowRight":
        case "Space":
          e.preventDefault();
          nextStory();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevStory();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, nextStory, prevStory, onClose]);

  // Handle video controls
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;

      if (isPaused) {
        videoRef.current.pause();
      } else {
        // Use promise to handle play errors gracefully
        videoRef.current.play().catch((error) => {
          console.warn("Video play failed:", error);
        });
      }
    }
  }, [isPaused, isMuted]);

  // Handle click on story area
  const handleStoryClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerX = rect.width / 2;

    if (clickX < centerX) {
      prevStory();
    } else {
      nextStory();
    }
  };

  // Handle pause/resume
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Handle mute/unmute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Handle reply
  const handleSendReply = () => {
    if (!replyMessage.trim()) return;

    // TODO: Implement reply functionality
    console.log("Reply:", replyMessage);
    setReplyMessage("");
    setShowReplyInput(false);
  };

  const handleLikeStory = async () => {
    if (!currentStory || isOwner || likeStoryMutation.isPending) return;

    // Rate limiting: prevent multiple likes within 1 second
    const now = Date.now();
    if (now - lastLikeTimeRef.current < 1000) {
      return;
    }
    lastLikeTimeRef.current = now;

    try {
      await likeStoryMutation.mutateAsync(currentStory._id);
    } catch (error) {
      console.error("Failed to like story:", error);
    }
  };
  // Don't render if not open or no story
  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 right-0 left-0 z-20">
        {/* Progress Bars */}
        <StoryProgressBar
          stories={currentUserStories.stories}
          currentStoryIndex={currentStoryIndex}
          isPlaying={!isPaused}
          duration={isVideo ? 30000 : 15000}
          videoRef={isVideo ? videoRef : null}
          onComplete={nextStory}
        />

        {/* User Info & Controls */}
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center space-x-3">
            <img
              src={currentStory.user?.avatarUrl || "/default-avatar.png"}
              alt={currentStory.user?.username}
              className="h-8 w-8 rounded-full border-2 border-white"
            />
            <div>
              <p className="text-sm font-semibold">{currentStory.user?.username}</p>
              <p className="text-xs text-white/80">
                {new Date(currentStory.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Pause/Play Button */}
            <button onClick={togglePause} className="rounded-full p-2 hover:bg-white/20">
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>

            {/* Mute/Unmute for videos */}
            {isVideo && (
              <button onClick={toggleMute} className="rounded-full p-2 hover:bg-white/20">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            )}

            {/* More Options */}
            <button className="rounded-full p-2 hover:bg-white/20">
              <MoreHorizontal size={20} />
            </button>

            {/* Close Button */}
            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/20">
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative flex h-full items-center justify-center">
        {/* Navigation Areas */}
        <button
          onClick={prevStory}
          className="absolute top-0 bottom-0 left-0 z-10 w-1/3"
          disabled={currentUserIndex === 0 && currentStoryIndex === 0}
        />
        <button
          onClick={handleStoryClick}
          className="absolute top-0 bottom-0 left-1/3 z-10 w-1/3"
        />
        <button onClick={nextStory} className="absolute top-0 right-0 bottom-0 z-10 w-1/3" />

        {/* Previous/Next User Navigation */}
        {currentUserIndex > 0 && (
          <button
            onClick={() => {
              setCurrentUserIndex((prev) => prev - 1);
              setCurrentStoryIndex(0);
            }}
            className="absolute top-1/2 left-4 z-20 -translate-y-1/2 transform rounded-full bg-white/20 p-2 hover:bg-white/30"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        )}

        {currentUserIndex < activeUserStories.length - 1 && (
          <button
            onClick={() => {
              setCurrentUserIndex((prev) => prev + 1);
              setCurrentStoryIndex(0);
            }}
            className="absolute top-1/2 right-4 z-20 -translate-y-1/2 transform rounded-full bg-white/20 p-2 hover:bg-white/30"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        )}

        {/* Media Content */}
        <div className="max-h-full w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="h-auto max-h-[85vh] w-full rounded-lg object-contain shadow-2xl"
              autoPlay
              muted={isMuted}
              playsInline
              onEnded={nextStory}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="h-auto max-h-[85vh] w-full rounded-lg object-contain shadow-2xl"
            />
          )}
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute right-4 bottom-20 left-4 z-20">
            <p className="rounded-lg bg-black/50 p-3 text-center text-white backdrop-blur-sm">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      {!isOwner && (
        <div className="absolute right-0 bottom-0 left-0 z-20 p-4">
          {showReplyInput ? (
            <div className="flex items-center space-x-2 rounded-full bg-white/10 p-2 backdrop-blur-md">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Trả lời story..."
                className="flex-1 bg-transparent px-4 py-2 text-white placeholder-white/70 outline-none"
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyMessage.trim()}
                className="p-2 text-white hover:text-blue-400 disabled:opacity-50"
              >
                <Send size={20} />
              </button>
              <button
                onClick={() => setShowReplyInput(false)}
                className="p-2 text-white hover:text-red-400"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLikeStory}
                  disabled={likeStoryMutation.isPending}
                  className={`p-3 transition-colors ${
                    isCurrentStoryLiked ? "text-red-500" : "text-white hover:text-red-400"
                  }`}
                >
                  <Heart size={24} fill={isCurrentStoryLiked ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Stats & Quick Reply */}
              <div className="flex items-center space-x-3">
                {/* View count (for owner only) */}
                {isOwner && currentStory.viewCount > 0 && (
                  <span className="text-sm text-white/80">👁 {currentStory.viewCount}</span>
                )}

                {/* Quick Reply */}
                <button
                  onClick={() => setShowReplyInput(true)}
                  className="rounded-full bg-white/20 px-6 py-2 text-sm text-white backdrop-blur-md hover:bg-white/30"
                >
                  Gửi tin nhắn
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Story Analytics for Owner */}
      {isOwner && (
        <div className="absolute right-4 bottom-4 left-4 z-20">
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-md">
            <div className="flex items-center justify-between text-sm text-white">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span>👁</span>
                  <span>{currentStory.viewCount || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>❤️</span>
                  <span>{currentStory.likeCount || 0}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  // Store current playing state and pause story
                  setWasPlayingBeforeModal(!isPaused);
                  setIsPaused(true);
                  setShowLikesModal(true);
                }}
                className="text-xs hover:text-blue-400"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Likes Modal */}
      <StoryLikesModal
        isOpen={showLikesModal}
        onClose={() => {
          setShowLikesModal(false);
          // Resume playing if it was playing before modal opened
          if (wasPlayingBeforeModal) {
            setIsPaused(false);
          }
        }}
        storyId={currentStory?._id}
        currentStory={currentStory}
      />
    </div>
  );
};

export default StoryViewer;
