import { api } from "./apiClient";

export const getProfile = async () =>
  (await api.get("/auth/profile")).data.data;
export const updateProfile = async (payload: {
  username?: string;
  email?: string;
  avatarUrl?: string;
}) => (await api.put("/users/profile", payload)).data;
export const getUserRooms = async (userId: string) =>
  (await api.get(`/users/${userId}/rooms`)).data;
export const getUsers = async () => (await api.get("/users")).data;
export const assignRole = async (payload: { userId: string; roleId: string }) =>
  (await api.post("/users/assign-role", payload)).data;
export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return (
    await api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
};
