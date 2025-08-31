import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { login, register, logout, getUser } from "../../lib/api";

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await login({ email, password });
      
      // After successful login, get user data
      const userResponse = await getUser();
      return { message: response.message, user: userResponse.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Đăng nhập thất bại.");
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    { email, username, password, confirmPassword },
    { rejectWithValue },
  ) => {
    try {
      const response = await register({
        email,
        username,
        password,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Đăng ký thất bại.");
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logout();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Đăng xuất thất bại.");
    }
  },
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUser();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Không thể lấy thông tin user.");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isLoading: false,
    error: null,
    isRegistered: false,
    isAuthenticated: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetRegistered: (state) => {
      state.isRegistered = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRegistered = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        // Don't set isLoading to true for getCurrentUser to avoid UI flashing
        // state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        // Don't automatically set isAuthenticated = false, let the UI handle it
        // This prevents infinite redirects when the server is not available
      });
  },
});

export const { clearError, resetRegistered, clearAuth } = authSlice.actions;
export default authSlice.reducer;
