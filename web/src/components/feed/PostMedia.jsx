import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from "lucide-react";

const PostMedia = ({
  mediaUrls,
  mediaType,
  altText,
  objectFit = "object-cover",
  isModal = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const videoRefs = useRef([]);
  const containerRef = useRef(null);

  // Helper function to check if URL is a video
  const isVideo = useCallback(
    (url) => {
      if (!url) return false;
      return (
        /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(url) ||
        url.includes("video") ||
        mediaType === "video"
      );
    },
    [mediaType]
  );

  // Auto-pause video when component unmounts or index changes
  useEffect(() => {
    const videos = videoRefs.current;
    return () => {
      videos.forEach((video) => {
        if (video) video.pause();
      });
    };
  }, []);

  // Intersection Observer for auto play/pause when 50% of video is visible
  // Skip intersection observer for modal since modal videos should be manually controlled
  useEffect(() => {
    if (isModal) return; // Skip auto-play/pause for modal videos

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);

          const currentVideo = videoRefs.current[currentIndex];
          const currentMedia = mediaUrls[currentIndex];

          if (currentVideo && currentMedia && isVideo(currentMedia)) {
            if (entry.isIntersecting) {
              // Auto-play when 50% visible
              currentVideo.play().catch(() => {
                setIsPlaying(false);
              });
            } else {
              // Auto-pause when less than 50% visible
              currentVideo.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the element is visible
        rootMargin: "0px",
      }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, [currentIndex, mediaUrls, isVideo, isModal]);

  // Auto-play current video when index changes (if in view)
  // For modal, set isInView to true so videos can be manually controlled
  useEffect(() => {
    if (isModal) {
      setIsInView(true);
      return;
    }

    if (!isInView) return;

    const currentVideo = videoRefs.current[currentIndex];
    const currentMedia = mediaUrls[currentIndex];
    if (currentVideo && currentMedia && isVideo(currentMedia)) {
      currentVideo.play().catch(() => {
        // Auto-play failed, user needs to interact first
        setIsPlaying(false);
      });
    }
  }, [currentIndex, mediaUrls, isVideo, isInView, isModal]);

  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? mediaUrls.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);

    // Pause current video when switching
    if (videoRefs.current[currentIndex]) {
      videoRefs.current[currentIndex].pause();
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    const newIndex = currentIndex === mediaUrls.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);

    // Pause current video when switching
    if (videoRefs.current[currentIndex]) {
      videoRefs.current[currentIndex].pause();
      setIsPlaying(false);
    }
  };

  const handleVideoToggle = () => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVideoClick = () => {
    handleVideoToggle();
  };

  const isCarousel = mediaType === "carousel" || mediaUrls.length > 1;
  const currentMedia = mediaUrls[currentIndex];
  const currentIsVideo = isVideo(currentMedia);

  // Different styling for modal vs regular post
  const containerStyles = isModal
    ? "relative w-full h-full bg-black overflow-hidden flex items-center justify-center"
    : "relative overflow-hidden rounded-md bg-black";

  const aspectRatioStyle = isModal ? {} : { aspectRatio: "3.8/5" };

  return (
    <div ref={containerRef} className={containerStyles} style={aspectRatioStyle}>
      {/* Main Media */}
      {currentIsVideo ? (
        <div className="relative flex h-full w-full items-center justify-center">
          <video
            ref={(el) => (videoRefs.current[currentIndex] = el)}
            src={currentMedia}
            className="max-h-full max-w-full cursor-pointer object-contain"
            muted={isMuted}
            loop
            playsInline
            autoPlay
            onClick={handleVideoClick}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Video Controls Overlay - Constrained to video bounds */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 hover:opacity-100">
            {/* Play/Pause Button */}
            <button
              onClick={handleVideoToggle}
              className="button-hover play-button-animate pointer-events-auto cursor-pointer rounded-full bg-black/60 p-4 text-white hover:bg-black/80"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
          </div>

          {/* Mute/Unmute Button - Positioned relative to video container */}
          <div className="absolute top-0 left-0 z-30 p-2">
            <button
              onClick={handleMuteToggle}
              className="button-hover cursor-pointer rounded-full bg-black/70 p-2 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/85"
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      ) : (
        <img
          src={currentMedia}
          alt={altText || `Post image ${currentIndex + 1}`}
          className={`${isModal ? "max-h-full max-w-full object-contain" : `${objectFit} h-full w-full`}`}
        />
      )}

      {/* Carousel Controls - Only show if not single media */}
      {isCarousel && (
        <>
          {/* Previous Button */}
          {currentIndex > 0 && (
            <div className="absolute top-1/2 left-0 z-50 -translate-y-1/2 p-2">
              <button
                onClick={handlePrevious}
                className="button-hover rounded-full bg-white/80 p-2 text-black opacity-75 transition-all duration-200 hover:bg-white/90 hover:opacity-100"
                style={{
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}

          {/* Next Button */}
          {currentIndex < mediaUrls.length - 1 && (
            <div className="absolute top-1/2 right-0 z-50 -translate-y-1/2 p-2">
              <button
                onClick={handleNext}
                className="button-hover rounded-full bg-white/80 p-2 text-black opacity-75 transition-all duration-200 hover:bg-white/90 hover:opacity-100"
                style={{
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Dots Indicator */}
          {mediaUrls.length > 1 && (
            <div className="absolute bottom-0 left-1/2 z-50 -translate-x-1/2 p-3">
              <div className="flex space-x-2">
                {mediaUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${
                      index === currentIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostMedia;
