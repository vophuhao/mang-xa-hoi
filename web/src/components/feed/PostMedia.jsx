import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from "lucide-react";

const PostMedia = ({ mediaUrls, mediaType, altText }) => {
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
  useEffect(() => {
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
  }, [currentIndex, mediaUrls, isVideo]);

  // Auto-play current video when index changes (if in view)
  useEffect(() => {
    if (!isInView) return;

    const currentVideo = videoRefs.current[currentIndex];
    const currentMedia = mediaUrls[currentIndex];
    if (currentVideo && currentMedia && isVideo(currentMedia)) {
      currentVideo.play().catch(() => {
        // Auto-play failed, user needs to interact first
        setIsPlaying(false);
      });
    }
  }, [currentIndex, mediaUrls, isVideo, isInView]);

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

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-md bg-black"
      style={{ aspectRatio: "3.8/5" }}
    >
      {/* Main Media */}
      {currentIsVideo ? (
        <div className="relative h-full w-full">
          <video
            ref={(el) => (videoRefs.current[currentIndex] = el)}
            src={currentMedia}
            className="h-full w-full object-cover"
            muted={isMuted}
            loop
            playsInline
            autoPlay
            onClick={handleVideoClick}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Video Controls Overlay */}
          <div className="video-overlay absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 hover:opacity-100">
            {/* Play/Pause Button */}
            <button
              onClick={handleVideoToggle}
              className="button-hover play-button-animate rounded-full bg-black/60 p-4 text-white hover:bg-black/80"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
          </div>

          {/* Mute/Unmute Button */}
          <button
            onClick={handleMuteToggle}
            className="button-hover absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      ) : (
        <img
          src={currentMedia}
          alt={altText || `Post image ${currentIndex + 1}`}
          className="h-full w-full object-cover"
        />
      )}

      {/* Carousel Controls */}
      {isCarousel && (
        <>
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            className="button-hover absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer rounded-full bg-white/80 p-1 text-black opacity-75 hover:bg-white/80 hover:opacity-100"
            style={{ display: currentIndex === 0 ? "none" : "block" }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="button-hover absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full bg-white/80 p-1 text-black opacity-75 hover:bg-white/80 hover:opacity-100"
            style={{
              display: currentIndex === mediaUrls.length - 1 ? "none" : "block",
            }}
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots Indicator */}
          {mediaUrls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 space-x-1">
              {mediaUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full ${
                    index === currentIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostMedia;
