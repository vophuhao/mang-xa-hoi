import { useEffect, useRef, useState } from "react";

const StoryProgressBar = ({
  stories = [],
  currentStoryIndex = 0,
  isPlaying = true,
  duration = 15000,
  videoRef = null,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(null);
  const animationIdRef = useRef(null);
  const pausedTimeRef = useRef(0);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
  }, [currentStoryIndex]);

  // Animation loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp - pausedTimeRef.current;
      }

      let newProgress;

      // Sync with video if available
      if (videoRef?.current && !videoRef.current.paused) {
        const videoDuration = videoRef.current.duration * 1000; // Convert to ms
        const currentTime = videoRef.current.currentTime * 1000; // Convert to ms
        newProgress = Math.min((currentTime / videoDuration) * 100, 100);
      } else {
        // Use timer-based progress for images or paused videos
        const elapsed = timestamp - startTimeRef.current;
        newProgress = Math.min((elapsed / duration) * 100, 100);
      }

      setProgress(newProgress);

      if (newProgress >= 100) {
        // Story completed
        onComplete?.();
        return;
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [isPlaying, duration, videoRef, onComplete]);

  // Handle pause/resume
  useEffect(() => {
    if (!isPlaying && startTimeRef.current) {
      // Store elapsed time when paused
      pausedTimeRef.current = (progress / 100) * duration;
    }
  }, [isPlaying, progress, duration]);

  return (
    <div className="flex space-x-1 p-2">
      {stories.map((_, index) => (
        <div key={index} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full bg-white"
            style={{
              width:
                index === currentStoryIndex
                  ? `${progress}%`
                  : index < currentStoryIndex
                    ? "100%"
                    : "0%",
              transition: index === currentStoryIndex ? "none" : "width 0.3s ease",
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default StoryProgressBar;
