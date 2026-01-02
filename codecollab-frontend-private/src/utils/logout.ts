import { setAccessToken, setRefreshToken } from "../services/apiClient";

/**
 * Logout utility function
 * Clears all authentication data and redirects to landing page
 */
export const logout = () => {
  // Clear tokens
  setAccessToken("");
  setRefreshToken("");

  // Clear user data
  localStorage.removeItem("userId");
  localStorage.removeItem("username");

  // Clear any other auth-related data
  localStorage.removeItem("user");

  // Redirect to landing page
  window.location.href = "/";
};
