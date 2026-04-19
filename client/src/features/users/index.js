import { axiosClient } from "../../shared/api/axiosClient";

export async function getProfile() {
  const response = await axiosClient.get("/users/me");
  return response.data;
}

export async function updateProfile(payload) {
  const response = await axiosClient.patch("/users/me", payload);
  return response.data;
}

export async function getMasters() {
  const response = await axiosClient.get("/users/masters");
  return response.data;
}

export async function createMaster(payload) {
  const response = await axiosClient.post("/users/master", payload);
  return response.data;
}
