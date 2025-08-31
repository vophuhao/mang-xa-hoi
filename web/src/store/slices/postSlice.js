import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

// Async thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/posts/feed');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

export const fetchExplorePosts = createAsyncThunk(
  'posts/fetchExplorePosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/posts/explore');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch explore posts');
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const response = await api.post('/posts', postData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

export const likePost = createAsyncThunk(
  'posts/likePost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.post('/posts/like', { postId });
      return { postId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like post');
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(`/posts/${postId}`);
      return postId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
  }
);

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    feedPosts: [],
    explorePosts: [],
    currentPost: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
    clearPosts: (state) => {
      state.feedPosts = [];
      state.explorePosts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feedPosts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch explore posts
      .addCase(fetchExplorePosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExplorePosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.explorePosts = action.payload;
      })
      .addCase(fetchExplorePosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create post
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feedPosts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Like post
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, likes, isLiked } = action.payload;
        const updatePost = (posts) => {
          const post = posts.find(p => p._id === postId);
          if (post) {
            post.likes = likes;
            post.isLiked = isLiked;
          }
        };
        updatePost(state.feedPosts);
        updatePost(state.explorePosts);
      })
      // Delete post
      .addCase(deletePost.fulfilled, (state, action) => {
        const postId = action.payload;
        state.feedPosts = state.feedPosts.filter(post => post._id !== postId);
        state.explorePosts = state.explorePosts.filter(post => post._id !== postId);
      });
  },
});

export const { clearError, setCurrentPost, clearPosts } = postSlice.actions;
export default postSlice.reducer;
