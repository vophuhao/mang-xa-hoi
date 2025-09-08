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
// Post interactions
export const likePost = async (postId) => API.post(`/posts/${postId}/like`);

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
//save Media
export const uploadMedia = async (formData) => {
  return API.post("/media/save", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};


