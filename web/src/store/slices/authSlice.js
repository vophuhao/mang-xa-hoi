import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { login, refreshToken, register } from "../../lib/api";

export const refreshTokenThunk = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await refreshToken();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Refresh token thất bại.");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await login({ email, password });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Đăng nhập thất bại.");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    { email, username, password, confirmPassword },
    { rejectWithValue }
  ) => {
    try {
      const response = await register({
        email,
        username,
        password,
        confirmPassword,
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Đăng ký thất bại.");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isLoading: false,
    error: null,
    isRegistered: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetRegistered: (state) => {
      state.isRegistered = false;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isRegistered = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Refresh Token
      .addCase(refreshTokenThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(refreshTokenThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.user = null; // Clear user on refresh failure
      });
  },
});

export const { clearError, resetRegistered, setUser, logout } =
  authSlice.actions;
export default authSlice.reducer;
