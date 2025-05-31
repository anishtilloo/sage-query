import http from "http";
import express from "express";
import cookieParser from "cookie-parser";

import { config } from "./config";
import { logger } from "./utils/logger";

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

server.listen({
    host: config.server.host,
    port: config.server.port,
});

server.on('listening', async () => {
    logger.info(`Server listing on port ${config.server.port}`);
});

server.on('error', (error) => {
    logger.error(`Server error ${error}`);
});

server.on('close', () => {
    logger.fatal(`Closing the server`);
});

