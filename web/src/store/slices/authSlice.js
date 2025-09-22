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

// Thêm action để restore user state từ localStorage
export const restoreAuthState = createAsyncThunk(
  "auth/restoreAuthState",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        const user = JSON.parse(userStr);
        return { user, token };
      } else {
        return rejectWithValue("No auth data found");
      }
    } catch (error) {
      return rejectWithValue("Invalid auth data");
    }
  }
);

// Trong initialState, thêm restore logic:
const getInitialAuthState = () => {
  const token = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("user");

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      return {
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialAuthState(), // ✅ Use function
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
      })
      // Restore Auth State
      .addCase(restoreAuthState.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { clearError, resetRegistered, setUser, logout } =
  authSlice.actions;
export default authSlice.reducer;
