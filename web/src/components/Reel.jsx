import { useState, useRef, useEffect } from "react";

import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX } from "lucide-react";

import useAuth from "@/hooks/useAuth";
import { getReelsFeed, likePost } from "@/lib/api";

export default function ReelWeb() {
  const [reels, setReels] = useState([]);
  const [likedMap, setLikedMap] = useState({});
  const [isMutedAll, setIsMutedAll] = useState(true); // ✅ state mute chung
  const containerRef = useRef(null);
  const videoRefs = useRef([]); // ✅ lưu danh sách ref video
  const { user } = useAuth();
  // Fetch reels
  useEffect(() => {
    if (!user?.data?._id) return;

    const fetchReels = async () => {
      try {
        const res = await getReelsFeed(1, 10);
        if (res.success) {
          setReels(res.data);
          const initialLiked = {};
          res.data.forEach(r => {
            initialLiked[r._id] = r.likedUsers?.includes(user.data._id) || false;
          });
          setLikedMap(initialLiked);
        }
      } catch (err) {
        console.error("Lỗi khi load reels:", err);
      }
    };
    fetchReels();
  }, [user?.data?._id]);

  // Auto play/pause video khi nằm trong viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const options = { root: containerRef.current, threshold: 0.6 };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) video.play();
        else video.pause();
      });
    }, options);

    const videos = containerRef.current.querySelectorAll("video");
    videos.forEach(video => observer.observe(video));

    return () => videos.forEach(video => observer.unobserve(video));
  }, [reels]);

  // Đồng bộ trạng thái mute với tất cả video
  useEffect(() => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = isMutedAll;
      }
    });
  }, [isMutedAll]);

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
      if (!res.success) {
        setLikedMap(prev => ({ ...prev, [reelId]: isLiked }));
        setReels(prev =>
          prev.map(r =>
            r._id === reelId
              ? { ...r, likeCount: Math.max(0, r.likeCount + (isLiked ? 1 : -1)) }
              : r
          )
        );
      }
    } catch (err) {
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

  // Toggle mute (áp dụng cho tất cả video)
  const toggleMuteAll = () => {
    setIsMutedAll(prev => !prev);
  };

  console.log("Reels:", reels);

  return (
    <div className="h-screen w-full flex justify-center text-white">
      <div
        ref={containerRef}
        className="h-screen w-[500px] sm:w-[400px] md:w-[500px] flex overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        <div className="flex flex-col items-center w-full">
          {reels.map((reel, index) => (
            <div
              key={reel._id}
              className="flex space-x-2 sm:space-x-3 md:space-x-4 snap-center items-center justify-center my-2"
            >
              {/* Video */}
              <div className="relative w-full sm:w-[350px] md:w-[420px] sm:h-[650px] md:h-[750px] overflow-hidden shadow-lg">
                <video
                  ref={el => (videoRefs.current[index] = el)}
                  className="w-full h-full object-contain bg-black"
                  src={reel.mediaUrls[0]}
                  loop
                  muted={isMutedAll}
                />

                {/* Info overlay */}
                <div className="absolute bottom-4 left-4 flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 ">
                    <img
                      src={reel.user?.avatar}
                      alt="avatar"
                      className="w-7 h-7 rounded-full"
                    />
                    <span className="font-semibold text-white">
                      {reel.user?.username || "user"}
                    </span>
                    <button className="ml-25 px-3 py-1 text-sm font-semibold text-white border border-white rounded-md bg-white/10 hover:bg-white/20 transition">
                      Theo dõi
                    </button>

                  </div>
                  <p className="text-sm max-w-[200px] sm:max-w-[230px] md:max-w-[250px]">
                    {reel.caption}
                  </p>
                </div>

                {/* Nút Mute/Unmute */}
                <button
                  onClick={toggleMuteAll}
                  className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
                >
                  {isMutedAll ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col mt-100 ml-2 items-center justify-center space-y-6">
                {/* Like */}
                <div className="flex flex-col items-center space-y-1">
                  <button onClick={handleLike(reel._id)}>
                    <Heart
                      size={25}
                      className={`transition-colors duration-200 ${likedMap[reel._id]
                          ? "fill-red-500 text-red-500"
                          : "text-black"
                        }`}
                    />
                  </button>
                  <span className="text-xs text-black">{reel.likeCount}</span>
                </div>

                {/* Comment */}
                <div className="flex flex-col items-center space-y-1">
                  <button>
                    <MessageCircle
                      size={25}
                      className="text-black transform rotate-270"
                    />
                  </button>
                  <span className="text-xs text-black">{reel.commentCount}</span>
                </div>

                {/* Share */}
                <button>
                  <Send size={25} className="text-black" />
                </button>

                {/* Bookmark */}
                <button>
                  <Bookmark size={25} className="text-black" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
