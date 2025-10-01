import { useState, useRef, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Play } from "lucide-react";

import useAuth from "@/hooks/useAuth";
import { getReelsFeed, likePost } from "@/lib/api";

export default function ReelWeb() {
  const [reels, setReels] = useState([]);
  const [likedMap, setLikedMap] = useState({});
  const [isMutedAll, setIsMutedAll] = useState(true);
  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const { user } = useAuth();
  const [isPlayingMap, setIsPlayingMap] = useState({});
  const userClickedMap = useRef({}); // đánh dấu video người dùng đã click
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = useRef(null);
  // Fetch reels
  useEffect(() => {
    if (!user?.data?._id) return;
    fetchReels(1);
  }, [user?.data?._id]);

  useEffect(() => {
  if (!loadMoreRef.current) return;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !loading) {
      setPage(prev => {
        const next = prev + 1;
        fetchReels(next);
        return next;
      });
    }
  }, { threshold: 1.0 });

  observer.observe(loadMoreRef.current);
  return () => observer.disconnect();
}, [loading]);

  const fetchReels = async (pageNum) => {
    try {
      setLoading(true);
      const res = await getReelsFeed(pageNum, 3); // luôn lấy 3 video
      if (res.success) {
        setReels(prev => [...prev, ...res.data]); // nối thêm video vào danh sách cũ
        const newLiked = {};
        res.data.forEach(r => {
          newLiked[r._id] = r.likedUsers?.includes(user.data._id) || false;
        });
        setLikedMap(prev => ({ ...prev, ...newLiked }));
      }
    } catch (err) {
      console.error("Lỗi khi load reels:", err);
    } finally {
      setLoading(false);
    }
  };


  // Auto play/pause video khi nằm trong viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const options = { root: containerRef.current, threshold: 0.6 };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        const reelId = video.dataset.reelId;
        if (!reelId) return;

        // Nếu người dùng chưa click, IntersectionObserver mới điều khiển play/pause
        if (!userClickedMap.current[reelId]) {
          if (entry.isIntersecting) {
            // chỉ cho phép video mới hiển thị play
            video.play();
            setIsPlayingMap(prev => ({ ...prev, [reelId]: true }));

            // pause tất cả video khác
            videoRefs.current.forEach(v => {
              if (v && v !== video) {
                v.pause();
                v.currentTime = 0; // reset về đầu
                setIsPlayingMap(prev => ({ ...prev, [v.dataset.reelId]: false }));
              }
            });
          } else {
            video.pause();
            video.currentTime = 0; // reset về đầu khi lướt đi
            setIsPlayingMap(prev => ({ ...prev, [reelId]: false }));
          }


          setIsPlayingMap(prev => ({ ...prev, [reelId]: entry.isIntersecting }));
        }
      });
    }, options);

    const videos = containerRef.current.querySelectorAll("video");
    videos.forEach(video => observer.observe(video));

    return () => videos.forEach(video => observer.unobserve(video));
  }, [reels]);

  // Đồng bộ trạng thái mute với tất cả video
  useEffect(() => {
    videoRefs.current.forEach(video => {
      if (video) video.muted = isMutedAll;
    });
  }, [isMutedAll]);

  // Khởi tạo isPlayingMap khi load reels
  useEffect(() => {
    const initialPlaying = {};
    reels.forEach((r, index) => {
      const video = videoRefs.current[index];
      if (video) initialPlaying[r._id] = !video.paused;
    });
    setIsPlayingMap(initialPlaying);
  }, [reels]);

  const togglePlay = (reelId, index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const isPlaying = isPlayingMap[reelId];
    if (isPlaying) {
      // Đang chạy → Pause
      video.pause();
      setIsPlayingMap(prev => ({ ...prev, [reelId]: false }));
      // setShowPauseMap(prev => ({ ...prev, [reelId]: true })); // hiện icon Pause
    } else {
      // Đang pause → Play
      video.play();
      setIsPlayingMap(prev => ({ ...prev, [reelId]: true }));
      // setShowPauseMap(prev => ({ ...prev, [reelId]: false })); // ẩn icon Pause
    }

    // Đánh dấu user đã click
    userClickedMap.current[reelId] = true;
  };

  // Toggle mute tất cả video
  const toggleMuteAll = () => setIsMutedAll(prev => !prev);

  // Toggle like
  const handleLike = (reelId) => async () => {
    const isLiked = likedMap[reelId] || false;
    setLikedMap(prev => ({ ...prev, [reelId]: !isLiked }));
    setReels(prev =>
      prev.map(r =>
        r._id === reelId
          ? { ...r, likeCount: Math.max(0, r.likeCount + (isLiked ? -1 : 1)) }
          : r
      )
    );

    try {
      const res = await likePost(reelId);
      if (!res.success) throw new Error("Like failed");
    } catch {
      setLikedMap(prev => ({ ...prev, [reelId]: isLiked }));
      setReels(prev =>
        prev.map(r =>
          r._id === reelId
            ? { ...r, likeCount: Math.max(0, r.likeCount + (isLiked ? 1 : -1)) }
            : r
        )
      );
    }
  };

  return (
    <div className="h-screen w-full flex justify-center text-white">
      <div
        ref={containerRef}
        className="h-screen w-[500px] sm:w-[400px] md:w-[500px] flex overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        <div className="flex flex-col items-center w-full">
          {reels.map((reel, index) => (
            <div key={reel._id} className="flex snap-center items-center justify-center my-2 w-full">
              <div

                className="relative w-full sm:w-[350px] md:w-[420px] sm:h-[650px] md:h-[750px] overflow-hidden shadow-lg cursor-pointer"
              >
                <video
                  ref={el => (videoRefs.current[index] = el)}
                  data-reel-id={reel._id}
                  className="w-full h-full object-contain bg-black"
                  src={reel.mediaUrls[0]}
                  loop
                  muted={isMutedAll}
                  onClick={() => togglePlay(reel._id, index)} // 👈 Thêm click
                />


                {/* Nút Play/Pause nằm giữa */}
                <AnimatePresence>
                  {!isPlayingMap[reel._id] && (
                    <motion.div
                      key="play-btn"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="bg-black/60 rounded-full p-6">
                        <Play className="w-7 h-7 text-white" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>


                {/* Info overlay */}
                <InfoOverlay reel={reel} />

                {/* Nút Mute/Unmute */}
                <button
                  onClick={toggleMuteAll}
                  className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
                >
                  {isMutedAll ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>
              </div>

              {/* Action buttons */}
              <ActionButtons reel={reel} handleLike={handleLike} likedMap={likedMap} />
            </div>
          ))}
          <div ref={loadMoreRef} className="h-10"></div>

        </div>
      </div>
    </div>
  );
}

function InfoOverlay({ reel }) {
  return (
    <div className={`absolute left-4 flex flex-col space-y-2 ${reel.caption ? "bottom-4" : "bottom-10"}`}>
      <div className="flex items-center space-x-2">
        <img src={reel.user?.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
        <div>
          <span className="font-semibold text-[13px] text-white">{reel.user?.username || "user"}</span>
          <div className="flex items-center space-x-1 text-[13px] text-gray-200 w-[180px] overflow-hidden">
            <span className="mr-1">🎵</span>
            <div className="relative w-full overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-[13px]">
                {reel.audioInfo?.title || "Âm thanh gốc"} • {reel.audioUser?.userId || reel.audioInfo?.artist}
              </div>
            </div>
          </div>
        </div>
        <button className="px-3 py-1 mt-3 text-sm font-semibold text-white border border-white rounded-md bg-white/10 hover:bg-white/20 transition">
          Theo dõi
        </button>
      </div>
      {reel.caption && <Caption caption={reel.caption} />}
    </div>
  );
}

function ActionButtons({ reel, handleLike, likedMap }) {
  return (
    <div className="flex flex-col mt-105 ml-5 items-center justify-center space-y-6">
      <div className="flex flex-col items-center space-y-1">
        <button onClick={handleLike(reel._id)}>
          <Heart
            size={25}
            className={`transition-colors duration-200 ${likedMap[reel._id] ? "fill-red-500 text-red-500" : "text-black"}`}
          />
        </button>
        {!reel.likesHidden && <span className="text-xs text-black">{reel.likeCount}</span>}
      </div>
      <div className="flex flex-col items-center space-y-1">
        <button disabled={reel.commentsDisabled}>
          <MessageCircle
            size={25}
            className={`transform rotate-270 ${reel.commentsDisabled ? "text-gray-400" : "text-black"}`}
          />
        </button>
        <span className="text-xs text-black">{reel.commentCount}</span>
      </div>
      <button>
        <Send size={25} className="text-black" />
      </button>
      <button className="mt-2">
        <Bookmark size={25} className="text-black" />
      </button>
      <div className="mt-10">
        <img src={reel.audioUser?.avatarUrl || reel.audioInfo?.coverUrl} alt="avatar" className="w-8 h-8 rounded-sm object-cover" />
      </div>
    </div>
  );
}

function Caption({ caption }) {
  const [expanded, setExpanded] = useState(false);
  if (!caption) return null;
  return (
    <p className="text-sm max-w-[250px] text-white">
      {expanded ? caption : caption.slice(0, 80)}{" "}
      {caption.length > 80 && (
        <button onClick={() => setExpanded(!expanded)} className="text-gray-300 text-xs ml-1">
          {expanded ? "Ẩn bớt" : "Xem thêm"}
        </button>
      )}
    </p>
  );
}
