import API from "../config/apiClient";

// =============== AUTH API ===============
export const register = async (data) => API.post("/auth/register", data);
export const login = async (data) => API.post("/auth/login", data);
export const googleLogin = async (data) => API.post("/auth/login/google", data);
export const logout = async () => API.get("/auth/logout");
export const refreshToken = async () => API.get("/auth/refresh");
export const sendEmailVerification = async (email) =>
  API.post("/auth/email/verification", { email });
export const verifyEmail = async (verificationCode) =>
  API.get(`/auth/email/verify/${verificationCode}`);
export const sendPasswordResetEmail = async (email) =>
  API.post("/auth/password/forgot", { email });
export const resetPassword = async ({ verificationCode, password }) =>
  API.post("/auth/password/reset", { verificationCode, password });

// =============== USER API ===============
// Get current user profile
export const getUser = async () => API.get("/users/me");
// Get suggested users
export const getSuggestedUsers = async () => API.get("/users/suggestions");
// Update current user profile
export const updateProfile = async (data) => API.patch("/users/me", data);
// Get user profile by username
export const getUserByUsername = async (username) =>
  API.get(`/users/${username}`);
// Get user's posts
export const getUserPosts = async (username) =>
  API.get(`/users/${username}/posts`);
// Get user's followers
export const getFollowers = async (username) =>
  API.get(`/users/${username}/followers`);
// Get user's following
export const getFollowing = async (username) =>
  API.get(`/users/${username}/following`);
// Follow/unfollow users
export const followUser = async (userId) => API.post(`/users/${userId}/follow`);
export const unfollowUser = async (userId) =>
  API.delete(`/users/${userId}/follow`);
// Search users
export const searchUsers = async (query, page = 1, limit = 20) => {
  return API.get(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
};
// Get user profile by userId
export const getUserByUserId = async (userId) =>
  API.get(`/users/userid/${userId}`);


// =============== SESSION API ===============
export const getSessions = async () => API.get("/sessions");
export const deleteSession = async (id) => API.delete(`/sessions/${id}`);

// =============== POST API ===============
// Post CRUD
export const createPost = async (data) => API.post("/posts", data);
export const getFeedPosts = async () => API.get("/posts/feed");
export const getTrendingPosts = async () => API.get("/posts/trending");
export const getPostById = async (id) => API.get(`/posts/${id}`);
export const updatePost = async (id, data) => API.put(`/posts/${id}`, data);
export const deletePost = async (id) => API.delete(`/posts/${id}`);
export const likePost = async (id) => API.post(`/posts/${id}/like`);
export const getReelsFeed = (page,limit) => {
  return API.get("/posts/reels", {
    params: { page, limit },
  });
};
// =============== COMMENT API ===============
// Comment CRUD for posts
export const addComment = async (postId, data) =>
  API.post(`/comments/post/${postId}`, data);
export const getComments = async (postId) =>
  API.get(`/comments/post/${postId}`);
export const updateComment = async (commentId, data) =>
  API.put(`/comments/${commentId}`, data);
export const deleteComment = async (commentId) =>
  API.delete(`/comments/${commentId}`);
// Comment interactions
export const likeComment = async (commentId) =>
  API.post(`/comments/${commentId}/like`);
// Reply system
export const getCommentReplies = async (commentId) =>
  API.get(`/comments/${commentId}/replies`);

// =============== MESSAGE API ===============
// Message CRUD
export const sendMessage = async (data) => API.post("/messages", data);
export const getConversations = async (page = 1, limit = 20) =>
  API.get(`/messages/conversations?page=${page}&limit=${limit}`);
export const getConversation = async (partnerId, page = 1, limit = 10) =>
  API.get(`/messages/conversation/${partnerId}?page=${page}&limit=${limit}`);
export const getMessageById = async (messageId) =>
  API.get(`/messages/${messageId}`);
export const deleteMessage = async (messageId) =>
  API.delete(`/messages/${messageId}`);

// Message interactions
export const markAsRead = async (messageId) =>
  API.put(`/messages/${messageId}/read`);
export const markAllAsRead = async (partnerId) =>
  API.put(`/messages/conversation/${partnerId}/read-all`);
export const reactToMessage = async (messageId, emoji) =>
  API.post(`/messages/${messageId}/react`, { emoji });
export const removeReaction = async (messageId) =>
  API.delete(`/messages/${messageId}/react`);

// Message search & filters
export const searchMessages = async (partnerId, query, page = 1, limit = 20) =>
  API.get(`/messages/search?partnerId=${partnerId}&query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
export const getMediaMessages = async (partnerId, mediaType = null, page = 1, limit = 20) => {
  const params = new URLSearchParams({ partnerId, page, limit });
  if (mediaType) params.append('mediaType', mediaType);
  return API.get(`/messages/media?${params}`);
};

// Message utilities
export const reportMessage = async (messageId, reason, description = null) =>
  API.post(`/messages/${messageId}/report`, { reason, description });
export const forwardMessage = async (messageId, recipientIds) =>
  API.post(`/messages/${messageId}/forward`, { recipientIds });

// User discovery for messaging
export const getSuggestedMessagingUsers = async (page = 1, limit = 10) =>
  API.get(`/messages/suggested?page=${page}&limit=${limit}`);
export const searchUsersToMessage = async (query, page = 1, limit = 10) =>
  API.get(`/messages/search-users?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);

// =============== MEDIA API ===============
//save Media
export const uploadMedia = async (formData) => {
  return API.post("/media/save", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const analyzeMedia = async (formData) => {
  return API.post("/media/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// =============== HASHTAG API ===============
export const searchHashtags = async (key, page = 1, limit = 50) => {
  return API.get("/hashtags/search", {
    params: {
      q: key,
      page,
      limit,
    },
  });
};

// utils/api/audio.js
export const getAudioList = async (q = "") => {
  return API.get("/audio/list", {
    params: { q }, // thêm query param
  });
};


export const trimVideo = (formData) =>
  API.post("/audio/trim-video", formData, { responseType: "blob" });
 

 export const fetchPreviewUrl = async (deezerId) => {
   return API.get(`/audio/preview/${deezerId}`);
};

export const createAudio = async (data) => API.post("/audio/create", data);

export const extracAudio = async (formData) => {
  return API.post("/audio/extract", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export const checkVideoHasAudio = async (formData) => {
  return API.post("/audio/check-audio", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export const getPostsByHashtag = async (name, page = 1, limit = 30) =>
  API.get(`/hashtags/${name}/posts`, { params: { page, limit } });

export const searchAll = async (query, page = 1, limit = 10) => {
  // Thêm từ khóa await để nhận đúng response
  const response = await API.get(`/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  return response; // Đảm bảo trả về response, không phải response.data
};