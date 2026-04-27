import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initSocketIo } from "./socket/io.js";

const app = createApp();
const server = http.createServer(app);
initSocketIo(server);

server.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API + WebSocket on http://localhost:${env.port}`);
});
