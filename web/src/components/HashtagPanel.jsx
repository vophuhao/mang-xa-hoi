import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import { getPostsByHashtag } from "../lib/api";

export default function HashtagPanel() {
  const { name } = useParams();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchPosts() {
      const res = await getPostsByHashtag(name);
      setPosts(res.data);
    }
    fetchPosts();
  }, [name]);

  return (
    <div>
      <h2 style={{ fontWeight: 600, fontSize: 22, margin: "16px 0" }}>#{name}</h2>
      <div className="hashtag-posts-grid">
        {posts.map(post => (
          <div key={post._id} className="hashtag-post-item">
            {post.mediaUrls[0] && (
              post.mediaUrls[0].endsWith(".mp4") ? (
                <video
                  src={post.mediaUrls[0]}
                  className="hashtag-post-img"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  autoPlay
                />
              ) : (
                <img
                  src={post.mediaUrls[0]}
                  alt={post.caption}
                  className="hashtag-post-img"
                />
              )
            )}
            <div className="hashtag-post-overlay">
              <span>
                <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 6 }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {post.likeCount?.toLocaleString() ?? 0}
              </span>
              <span style={{ marginLeft: 18 }}>
                <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 6 }}>
                  <path d="M21 6.5a2.5 2.5 0 0 0-2.5-2.5h-13A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-11zm-2.5-1.5a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 5h13z"/>
                </svg>
                {post.commentCount?.toLocaleString() ?? 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}