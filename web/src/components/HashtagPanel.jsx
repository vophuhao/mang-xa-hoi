import { useEffect, useState } from "react";

import { Heart, MessageCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { getPostsByHashtag } from "../lib/api";

import PostModal from "./feed/PostModal";

export default function HashtagPanel() {
  const navigate = useNavigate();
  const { name } = useParams();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await getPostsByHashtag(name);
        setPosts(res.data || []);
      } catch (err) {
        console.error("Lỗi khi tải bài viết:", err);
      }
    }
    fetchPosts();
  }, [name]);

  const handleUsernameClick = (username) => {
    navigate(`/${username}`);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans">
      <h2 style={{ fontWeight: 600, fontSize: 22, margin: "16px 0" }}>#{name}</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {posts.map((post) => {
          // ✅ Lấy phần tử media đầu tiên
          const firstMedia = Array.isArray(post.mediaUrls)
            ? post.mediaUrls[0]
            : post.mediaUrls;

          // ✅ Kiểm tra định dạng file
          const isVideo = firstMedia?.match(/\.(mp4|mov|avi|webm)$/i);
          const isImage = firstMedia?.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i);

          return (
            <div
              key={post._id || post.id}
              onClick={() => handlePostClick(post)}
              className="relative group cursor-pointer overflow-hidden rounded-lg"
            >
              {/* ✅ Hiển thị ảnh hoặc video */}
              {isVideo ? (
                <video
                  src={firstMedia}
                  className="object-cover w-full h-full"
                  muted
                  loop
                  playsInline
                />
              ) : isImage ? (
                <img
                  src={firstMedia}
                  alt={post.caption}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  Không có media
                </div>
              )}

              {/* 💬 Hiển thị like & comment khi hover */}
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white text-sm font-medium rounded-lg">
                <div className="flex items-center gap-1">
                  <Heart className="h-5 w-5" fill="white" />
                  {post.likeCount}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-5 w-5" fill="white" />
                  {post.commentCount}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Modal bài viết */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={handleCloseModal}
          onUsernameClick={handleUsernameClick}
        />
      )}
    </div>
  );
}
