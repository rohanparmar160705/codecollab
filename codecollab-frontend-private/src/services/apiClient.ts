import axios from "axios";
import { logout } from "../utils/logout";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Token persistence in localStorage for simplicity
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const getAccessToken = () =>
  localStorage.getItem(ACCESS_TOKEN_KEY) || "";
export const setAccessToken = (token: string) => {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
};
export const getRefreshToken = () =>
  localStorage.getItem(REFRESH_TOKEN_KEY) || "";
export const setRefreshToken = (token: string) => {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    const hdrs = (config.headers || {}) as any;
    hdrs.Authorization = `Bearer ${token}`;
    config.headers = hdrs;
  }
  return config;
});

let isRefreshing = false as boolean;
let refreshQueue: Array<{ resolve: () => void; reject: (e: any) => void }> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config || {};
    const status = error?.response?.status;

    // Don't retry if not 401, already retried, or is the refresh endpoint itself
    if (
      status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/refresh-token")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      await new Promise<void>((resolve, reject) =>
        refreshQueue.push({ resolve, reject })
      );
      original._retry = true;
      return api(original);
    }

    isRefreshing = true;
    original._retry = true;
    try {
      const rt = getRefreshToken();
      if (!rt) {
        throw new Error("No refresh token");
      }

      // Use a separate axios instance for refresh to avoid interceptor loop
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken: rt },
        { headers: { "Content-Type": "application/json" } }
      );

      const newAccess =
        refreshResponse.data?.data?.accessToken ||
        refreshResponse.data?.accessToken;
      const newRefresh =
        refreshResponse.data?.data?.refreshToken ||
        refreshResponse.data?.refreshToken ||
        rt;

      if (!newAccess) {
        throw new Error("No access token in refresh response");
      }

      setAccessToken(newAccess);
      if (newRefresh) setRefreshToken(newRefresh);

      refreshQueue.forEach((q) => q.resolve());
      refreshQueue = [];
      return api(original);
    } catch (e) {
      refreshQueue.forEach((q) => q.reject(e));
      refreshQueue = [];

      // Logout user completely
      console.log("Token refresh failed, logging out...");
      logout();

      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);
