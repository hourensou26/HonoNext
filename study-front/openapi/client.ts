import createClient from "openapi-fetch";
import { paths } from "./schema";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendUrl) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is required");
}
const api = createClient<paths>({
  baseUrl: new URL(backendUrl).origin,
});

export default api;