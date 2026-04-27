import { axiosClient } from "../../shared/api/axiosClient";

export async function createAssignment(payload) {
  const response = await axiosClient.post("/assignments", payload);
  return response.data;
}

export async function getActiveAssignments() {
  const response = await axiosClient.get("/assignments/active");
  return response.data;
}
