import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true, // Important: This enables cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - could redirect to login
      console.log('Unauthorized access - user may need to login');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.get('/auth/logout');
    return response.data;
  },
  refreshToken: async () => {
    const response = await apiClient.get('/auth/refresh');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/user/me');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getCurrentUser: async () => {
    const response = await apiClient.get('/user/me');
    return response.data;
  },
  getUserProfile: async (username) => {
    const response = await apiClient.get(`/user/${username}`);
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await apiClient.patch('/user/me', data);
    return response.data;
  },
  followUser: async (userId) => {
    const response = await apiClient.post(`/user/${userId}/follow`);
    return response.data;
  },
  unfollowUser: async (userId) => {
    const response = await apiClient.delete(`/user/${userId}/follow`);
    return response.data;
  },
  searchUsers: async (query) => {
    const response = await apiClient.get(`/user/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
  getSuggestedUsers: async () => {
    const response = await apiClient.get('/user/suggestions');
    return response.data;
  },
};

// Posts API
export const postsAPI = {
  getPosts: async (page = 1, limit = 10) => {
    const response = await apiClient.get(`/post?page=${page}&limit=${limit}`);
    return response.data;
  },
  getPost: async (postId) => {
    const response = await apiClient.get(`/post/${postId}`);
    return response.data;
  },
  createPost: async (postData) => {
    const response = await apiClient.post('/post', postData);
    return response.data;
  },
  updatePost: async (postId, data) => {
    const response = await apiClient.patch(`/post/${postId}`, data);
    return response.data;
  },
  deletePost: async (postId) => {
    const response = await apiClient.delete(`/post/${postId}`);
    return response.data;
  },
  likePost: async (postId) => {
    const response = await apiClient.post(`/post/${postId}/like`);
    return response.data;
  },
  unlikePost: async (postId) => {
    const response = await apiClient.delete(`/post/${postId}/like`);
    return response.data;
  },
  getUserPosts: async (username, page = 1, limit = 10) => {
    const response = await apiClient.get(`/user/${username}/posts?page=${page}&limit=${limit}`);
    return response.data;
  },
};

// Legacy exports for backward compatibility (needed by authSlice.js and other files)
export const login = authAPI.login;
export const register = authAPI.register;
export const logout = authAPI.logout;
export const getCurrentUser = authAPI.getCurrentUser;
export const getUser = usersAPI.getCurrentUser; // This is what authSlice.js needs
export const forgotPassword = async ({ email }) =>
  apiClient.post("/auth/password/forgot", { email });
export const resetPassword = async ({ verificationCode, password }) =>
  apiClient.post("/auth/password/reset", { verificationCode, password });
export const getSessions = async () => apiClient.get("/sessions");
export const deleteSession = async (id) => apiClient.delete(`/sessions/${id}`);

export { apiClient as api };
export default apiClient;
