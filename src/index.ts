import http from "node:http";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { config } from "./config";
import { logger } from "./utils/logger";
import ragRoutes from "./routes/rag.routes";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Routes
app.use('/api/rag', ragRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        data: null
    });
});

// Server setup
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

