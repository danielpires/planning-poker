import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer } from "./websocket";

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(`${__dirname}/../`, "public")));

new WebSocketServer(server);

const PORT = 3002;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
