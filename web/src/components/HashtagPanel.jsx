import { useEffect, useState } from "react";

import { Heart, MessageCircle, Eye } from "lucide-react";
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
      const res = await getPostsByHashtag(name);
      setPosts(res.data);
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
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => handlePostClick(post)}
            className="relative group cursor-pointer"
          >
            <video
              src={post.mediaUrls}
              alt={post.caption}
              className="object-cover w-full h-100 "
            />          
            {/* Hiển thị like & comment khi hover */}
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white text-sm font-medium rounded-lg">
              <div className="flex items-center gap-1">
                <Heart className="h-5 w-5 " fill="white"/>
                {post.likeCount}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-5 w-5 " fill="white"/>
                {post.commentCount}
              </div>
            </div>
          </div>
        ))}
      </div>
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