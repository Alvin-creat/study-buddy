import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from './utils/jwt';
import { PrismaClient } from '@prisma/client';
import type { ServerToClientEvents, ClientToServerEvents } from './types';

const prisma = new PrismaClient();

const onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

export function setupWebSocket(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
) {
  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Broadcast online status to buddies
    broadcastStatus(io, userId, 'online');

    logger.info(`User ${userId} connected (${onlineUsers.get(userId)!.size} sockets)`);

    // ─── Join chat rooms ───────────────────

    socket.on('chat:join', async (data: { buddyshipId: string }) => {
      // Verify user belongs to this buddyship
      const buddyship = await prisma.buddyship.findUnique({
        where: { id: data.buddyshipId },
        select: { userAId: true, userBId: true },
      });

      if (!buddyship) {
        socket.emit('error', { message: 'Buddyship not found' });
        return;
      }

      if (buddyship.userAId !== userId && buddyship.userBId !== userId) {
        socket.emit('error', { message: 'Not your chat room' });
        return;
      }

      socket.join(`room:${data.buddyshipId}`);
    });

    socket.on('chat:leave', (data: { buddyshipId: string }) => {
      socket.leave(`room:${data.buddyshipId}`);
    });

    // ─── Send message ─────────────────────

    socket.on('chat:message', async (msg) => {
      const { buddyshipId, type, content } = msg;

      // Verify buddyship
      const buddyship = await prisma.buddyship.findUnique({
        where: { id: buddyshipId },
        select: { id: true, userAId: true, userBId: true, status: true },
      });

      if (!buddyship || buddyship.status !== 'ACTIVE') {
        socket.emit('error', { message: 'Buddyship not active' });
        return;
      }

      if (buddyship.userAId !== userId && buddyship.userBId !== userId) {
        socket.emit('error', { message: 'Not your chat room' });
        return;
      }

      // Save message to DB
      const message = await prisma.message.create({
        data: {
          buddyshipId,
          senderId: userId,
          type: (type as any) || 'TEXT',
          content,
        },
        include: {
          sender: { select: { id: true, nickname: true, avatar: true } },
        },
      });

      // Broadcast to room
      io.to(`room:${buddyshipId}`).emit('chat:message', {
        id: message.id,
        buddyshipId: message.buddyshipId,
        senderId: message.senderId,
        type: message.type,
        content: message.content,
        contentTranslated: message.contentEn || undefined,
        mediaUrl: message.mediaUrl || undefined,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      });
    });

    // ─── Mark as read ─────────────────────

    socket.on('chat:read', async (data) => {
      const { buddyshipId, messageIds } = data;
      if (!messageIds?.length) return;

      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          buddyshipId,
          senderId: { not: userId }, // Only mark others' messages as read
        },
        data: { isRead: true, readAt: new Date() },
      });

      // Notify sender
      messageIds.forEach((msgId: string) => {
        io.to(`room:${buddyshipId}`).emit('chat:read', {
          messageId: msgId,
          readBy: userId,
        });
      });
    });

    // ─── Typing indicator ─────────────────

    socket.on('chat:typing', (data) => {
      socket.to(`room:${data.buddyshipId}`).emit('chat:typing', {
        buddyshipId: data.buddyshipId,
        userId,
        isTyping: data.isTyping,
      });
    });

    // ─── Disconnect ───────────────────────

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          broadcastStatus(io, userId, 'offline');
        }
      }
      logger.info(`User ${userId} disconnected`);
    });
  });
}

function broadcastStatus(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  userId: string,
  status: 'online' | 'offline'
) {
  // In production: fetch all buddy relationships and notify active buddies
  io.emit(`chat:${status}` as any, { userId });
}

import { logger } from './utils/logger';
