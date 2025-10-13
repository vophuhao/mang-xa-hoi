import { useState, useRef, useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Play, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

import useAuth from "@/hooks/useAuth";
import { USER_QUERY_KEYS, useUser, useUserFollowing } from "@/hooks/useUser";
import { getReelsFeed, increasePostView, likePost } from "@/lib/api";
import { navigate } from "@/lib/navigation";
import CommentModal from "@/modals/CommentReelModal";

import MoreOptionsMenu from "./MoreOptionsMenu";


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
  const viewedSet = useRef(new Set());
  const [openMenu, setOpenMenu] = useState(null); // null hoặc {x, y}
  const [reelId, setReelId] = useState(null);

  const { toggleFollow } = useUser();
  const [showComments, setShowComments] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { data: followingData } = useUserFollowing(user?.data?.userId, 1);
  const followingIds = new Set(followingData?.data?.map((u) => u._id));

  const handleFollowClick = async (targetUserId, isFollowing) => {
    try {

      await toggleFollow(targetUserId, isFollowing);
      // Cập nhật lại cache sau khi follow/unfollow
      queryClient.invalidateQueries(["userFollowing", user?.data?.userId], 1);
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const handleAudioClick = (audioInfo) => () => {
    if (!audioInfo) return;
    navigate(`/audio/${audioInfo._id}`);
  };



  useEffect(() => {
    const viewTimers = {}; // 👈 Xóa phần ": Record<string, NodeJS.Timeout>"

    videoRefs.current.forEach((video) => {
      if (!video) return;
      const reelId = video.dataset.reelId;

      const onPlay = () => {
        if (viewedSet.current.has(reelId)) return;

        // Đặt timer 10s để tính view
        viewTimers[reelId] = setTimeout(async () => {
          try {
            await increasePostView(reelId);
            viewedSet.current.add(reelId);
            console.log(`✅ View increased for ${reelId}`);
          } catch (err) {
            console.error("❌ Lỗi khi tăng view:", err);
          }
        }, 10000);
      };

      const onPause = () => {
        if (viewTimers[reelId]) {
          clearTimeout(viewTimers[reelId]);
          delete viewTimers[reelId];
        }
      };

      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("ended", onPause);

      return () => {
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("ended", onPause);
        if (viewTimers[reelId]) clearTimeout(viewTimers[reelId]);
      };
    });
  }, [reels]);


  // Fetch reels
  useEffect(() => {
    if (!user?.data?._id) return;
    fetchReels(1);
  }, [user?.data?._id]);

  useEffect(() => {
    if (!containerRef.current) return;
    const options = { root: containerRef.current, threshold: 0.6 };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        const reelId = video.dataset.reelId;
        const index = Number(video.dataset.index);
        if (!reelId) return;

        // ✅ Auto load thêm khi gần cuối danh sách
        if (entry.isIntersecting && index >= reels.length - 3 && !loading) {
          setPage(prev => {
            const next = prev + 1;
            fetchReels(next);
            return next;
          });
        }

        // Auto play/pause như cũ
        if (!userClickedMap.current[reelId]) {
          if (entry.isIntersecting) {
            video.play();
            setIsPlayingMap(prev => ({ ...prev, [reelId]: true }));
            // pause video khác
            videoRefs.current.forEach(v => {
              if (v && v !== video) {
                v.pause();
                v.currentTime = 0;
                setIsPlayingMap(prev => ({ ...prev, [v.dataset.reelId]: false }));
              }
            });
          } else {
            video.pause();
            video.currentTime = 0;
            setIsPlayingMap(prev => ({ ...prev, [reelId]: false }));
          }
        }
      });
    }, options);

    const videos = containerRef.current.querySelectorAll("video");
    videos.forEach(video => observer.observe(video));

    return () => videos.forEach(video => observer.unobserve(video));
  }, [reels, loading]);


  const fetchReels = async (pageNum) => {
    try {
      setLoading(true);
      const res = await getReelsFeed(pageNum, 20); // luôn lấy 3 video
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
                  data-index={index}
                  data-reel-id={reel._id}
                  className="w-full h-full object-contain bg-black"
                  src={reel.mediaUrls[0]}
                  loop
                  muted={isMutedAll}
                  onClick={() => togglePlay(reel._id, index)}
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
                <InfoOverlay reel={reel}
                  handleAudioClick={handleAudioClick}
                  user={user}
                  handleFollowClick={handleFollowClick}
                  isFollowing={followingIds.has(reel.user?._id)}
                />

                {/* Nút Mute/Unmute */}
                <button
                  onClick={toggleMuteAll}
                  className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
                >
                  {isMutedAll ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>
              </div>

              {/* Action buttons */}
              <ActionButtons
                reel={reel}
                handleLike={handleLike}
                likedMap={likedMap}
                handleAudioClick={handleAudioClick}
                setOpenMenu={setOpenMenu}
                setReelId={setReelId}
                user={user}
                onOpenComments={() => {
                  setSelectedReel(reel); // lưu reel hiện tại
                  setShowComments(true); // mở modal
                }}
              />

            </div>

          ))}
          <div ref={loadMoreRef} className="h-10"></div>

        </div>
      </div>
      {openMenu && (
        <MoreOptionsMenu
          onClose={() => setOpenMenu(null)}
          reelId={reelId} // 👈 truyền reelId
          position={openMenu} // 👈 truyền vị trí
        />
      )}

      {showComments && selectedReel && (
        <CommentModal
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          postId={selectedReel._id}
          post={selectedReel}
          currentUserId={user.data._id}
        />
      )}


    </div>

  );
}

function InfoOverlay({ reel, handleAudioClick, user, handleFollowClick, isFollowing }) {
  return (
    <div className={`absolute left-4 flex flex-col space-y-2 ${reel.caption ? "bottom-4" : "bottom-10"}`}>
      <div className="flex items-center space-x-2">
        <img src={reel.user?.avatar} alt="avatar" className="w-8 h-8 rounded-full" onClick={() => navigate(`/${reel.user?.userId}`)} />
        <div>
          <span onClick={() => navigate(`/${reel.user?.userId}`)} className="font-semibold text-[13px] text-white">{reel.user?.userId || "user"}</span>
          <div onClick={handleAudioClick(reel.audioInfo)} className="flex items-center space-x-1 text-[13px] text-gray-200 w-[180px] overflow-hidden">
            <span className="mr-1">🎵</span>
            <div className="relative w-full overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-[13px]">
                {reel.audioInfo?.title || "Âm thanh gốc"} • {reel.audioUser?.userId || reel.audioInfo?.artist}
              </div>
            </div>
          </div>
        </div>
        {reel.user?._id !== user.data._id ? (
          <button

            onClick={() => handleFollowClick(reel.user?._id, isFollowing)}
            className="cursor-pointer px-3 py-1 mt-3 text-sm font-semibold text-white border border-white rounded-md bg-white/10 hover:bg-white/20 transition">
            {isFollowing ? "Đang theo dõi" : "Theo dõi"}
          </button>
        ) : null}
      </div>

      {reel.caption && <Caption caption={reel.caption} />}
    </div>

  );
}

function ActionButtons({ reel, handleLike, likedMap, handleAudioClick, setOpenMenu, setReelId, onOpenComments  }) {
  return (
    <div className="flex flex-col mt-100 ml-5 items-center justify-center space-y-6">
      {/* Like button */}
      <div className="flex flex-col items-center space-y-1 ">
        <button onClick={handleLike(reel._id)}>
          <Heart
            size={25}
            className={` cursor-pointer transition-colors duration-200 ${likedMap[reel._id] ? "fill-red-500 text-red-500" : "text-black dark:text-white"}`}
          />
        </button>
        {!reel.likesHidden && <span className="text-xs text-black dark:text-white">{reel.likeCount}</span>}
      </div>

      {/* Comment button */}
      <div className="flex flex-col items-center space-y-1 "
      onClick={onOpenComments} >
        <button disabled={reel.commentsDisabled}>
          <MessageCircle
            size={25}
            className={`cursor-pointer transform rotate-270 ${reel.commentsDisabled ? "text-gray-400" : "text-black dark:text-white"}`}
          />
        </button>
        <span className="text-xs text-black dark:text-white">{reel.commentCount}</span>
      </div>

      <button>
        <Send size={25} className="text-black dark:text-white cursor-pointer" />
      </button>

      <button className="mt-2">
        <Bookmark size={25} className="text-black dark:text-white cursor-pointer" />
      </button>

      <button
        className=" relative z-20 dark:text-white  cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect(); // lấy toạ độ icon
          setOpenMenu({ x: rect.left, y: rect.bottom }); // lưu vị trí
          setReelId(reel._id); // lưu reelId
        }}
      >
        <MoreHorizontal size={25} className="text-black dark:text-white" />
      </button>



      {/* 👇 Thêm click chuyển trang âm thanh */}
      <div className="mt-4 cursor-pointer" onClick={handleAudioClick(reel.audioInfo)}>
        <img
          src={reel.audioUser?.avatarUrl || reel.audioInfo?.coverUrl}
          alt="avatar"
          className="w-8 h-8 rounded-sm object-cover hover:opacity-80 transition"
        />
      </div>
    </div>

  );
}




function Caption({ caption }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  if (!caption) return null;

  // Cắt ngắn caption nếu chưa expand
  const displayText = expanded ? caption : caption.slice(0, 80);

  // ✅ Hàm xử lý tách hashtag & mention
  const parseCaption = (text) => {
    const parts = text.split(/(#[a-zA-Z0-9_À-ỹ]+|@[a-zA-Z0-9_.]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        const tag = part.slice(1);
        return (
          <span
            key={index}
            onClick={() => navigate(`/hashtags/${encodeURIComponent(tag)}`)}
            className="text-white cursor-pointer "
          >
            {part}
          </span>
        );
      }
      if (part.startsWith("@")) {
        const userId = part.slice(1);
        return (
          <span
            key={index}
            onClick={() => navigate(`/${encodeURIComponent(userId)}`)}
            className=" cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };


  return (
    <p className="text-sm max-w-[250px] text-white">
      {parseCaption(displayText)}{" "}
      {caption.length > 80 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-300 text-xs ml-1"
        >
          {expanded ? "Ẩn bớt" : "Xem thêm"}
        </button>
      )}
    </p>
  );
}

