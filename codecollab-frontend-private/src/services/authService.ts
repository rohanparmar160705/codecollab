import { api, setAccessToken, setRefreshToken } from "./apiClient";

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { username: string; email: string; password: string };

function normalizeAuthResponse(raw: any) {
  const d = raw ?? {};

  return {
    user: d.user ?? null,
    accessToken: d.accessToken ?? null,
    refreshToken: d.refreshToken ?? null,
  };
}

export const login = async (payload: LoginPayload) => {
  const res = await api.post("/auth/login", payload);

  // backend returns: { success, message, data: {...} }
  const norm = normalizeAuthResponse(res.data?.data);

  if (norm.accessToken) setAccessToken(norm.accessToken);
  if (norm.refreshToken) setRefreshToken(norm.refreshToken);
  return norm;
};

export const register = async (payload: RegisterPayload) => {
  const res = await api.post("/auth/register", payload);

  // backend returns: { success, message, data: {...} }
  const norm = normalizeAuthResponse(res.data?.data);

  if (norm.accessToken) setAccessToken(norm.accessToken);
  if (norm.refreshToken) setRefreshToken(norm.refreshToken);
  return norm;
};

export const refreshToken = async (refreshTokenValue: string) => {
  const res = await api.post("/auth/refresh-token", {
    refreshToken: refreshTokenValue,
  });

  const norm = normalizeAuthResponse(res.data?.data);

  if (norm.accessToken) setAccessToken(norm.accessToken);

  return norm;
};
