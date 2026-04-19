import { axiosClient } from "../../shared/api/axiosClient";

export async function getServices() {
  const response = await axiosClient.get("/services");
  return response.data;
}
