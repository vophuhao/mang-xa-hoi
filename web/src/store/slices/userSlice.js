import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { api } from '../../lib/api';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'users/fetchUserProfile',
  async (username, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${username}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'users/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch current user');
    }
  }
);

export const fetchSuggestedUsers = createAsyncThunk(
  'users/fetchSuggestedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/suggestions');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch suggested users');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/search?q=${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

export const followUser = createAsyncThunk(
  'users/followUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/users/${userId}/follow`);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to follow user');
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'users/unfollowUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/users/${userId}/follow`);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unfollow user');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'users/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.patch('/users/me', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    currentUser: null,
    profileUser: null,
    suggestedUsers: [],
    searchResults: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setProfileUser: (state, action) => {
      state.profileUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profileUser = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch suggested users
      .addCase(fetchSuggestedUsers.fulfilled, (state, action) => {
        state.suggestedUsers = action.payload;
      })
      // Search users
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      // Follow user
      .addCase(followUser.fulfilled, (state, action) => {
        const { userId } = action.payload;
        // Update suggested users
        const suggestedUser = state.suggestedUsers.find(user => user._id === userId);
        if (suggestedUser) {
          suggestedUser.isFollowing = true;
        }
        // Update profile user if viewing their profile
        if (state.profileUser && state.profileUser._id === userId) {
          state.profileUser.isFollowing = true;
          state.profileUser.followersCount += 1;
        }
      })
      // Unfollow user
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const { userId } = action.payload;
        // Update suggested users
        const suggestedUser = state.suggestedUsers.find(user => user._id === userId);
        if (suggestedUser) {
          suggestedUser.isFollowing = false;
        }
        // Update profile user if viewing their profile
        if (state.profileUser && state.profileUser._id === userId) {
          state.profileUser.isFollowing = false;
          state.profileUser.followersCount -= 1;
        }
      })
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.currentUser = { ...state.currentUser, ...action.payload };
      });
  },
});

export const { clearError, clearSearchResults, setProfileUser } = userSlice.actions;
export default userSlice.reducer;
