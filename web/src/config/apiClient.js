import axios from "axios";
import queryClient from "./queryClient";
import { UNAUTHORIZED } from "../constants/http.mjs";
import { navigate } from "../lib/navigation";

const options = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
};

// create a separate client for refreshing the access token
// to avoid infinite loops with the error interceptor
const TokenRefreshClient = axios.create(options);
TokenRefreshClient.interceptors.response.use((response) => response.data);

const API = axios.create(options);

API.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { config, response } = error;
    const { status, data } = response || {};

    if (status === UNAUTHORIZED && data?.errorCode === "InvalidAccessToken") {
      try {
        // Kiểm tra có refresh token không (ví dụ lưu trong localStorage hoặc cookie)
        const hasRefreshToken = document.cookie.includes("refreshToken=");
        if (!hasRefreshToken) {
          throw new Error("No refresh token");
        }

        // Refresh token
        await TokenRefreshClient.get("/auth/refresh");

        // Retry bằng API (client chính), không phải TokenRefreshClient
        return API(config);
      } catch (err) {
        queryClient.clear();
        navigate("/login", {
          state: { redirectUrl: window.location.pathname },
        });
      }
    }

    return Promise.reject({ status, ...data });
  }
);

export default API;
