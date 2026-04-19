import { axiosClient } from "../../shared/api/axiosClient";

export async function createAssignment(payload) {
  const response = await axiosClient.post("/assignments", payload);
  return response.data;
}
