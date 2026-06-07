import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { i18nMiddleware } from './middleware/i18n';
import { routes } from './routes';
import { setupWebSocket } from './websocket';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);

// ─── Socket.IO ────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: { origin: config.corsOrigins, methods: ['GET', 'POST'] },
  path: '/ws',
});

// ─── Global Middleware ────────────────────

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(i18nMiddleware);

// ─── Routes ──────────────────────────────

app.use('/api/v1', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler ────────────────────────

app.use(errorHandler);

// ─── WebSocket ────────────────────────────

setupWebSocket(io);

// ─── Start Server ─────────────────────────

httpServer.listen(config.port, () => {
  logger.info(`StudyBuddy server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export { app, io };
