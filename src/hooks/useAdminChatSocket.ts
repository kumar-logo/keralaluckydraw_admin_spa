import { useEffect, useRef } from 'react';
import { type Socket } from 'socket.io-client';
import { getApiBaseUrl } from '../config/env';
import type { AdminChatMessage } from '../services/chatApi';

interface ChatDeletePayload {
  id: number;
  groupId: number;
}

interface ChatTypingPayload {
  groupId: number;
  userId: string;
  isAdmin: boolean;
}

interface Handlers {
  onNew: (msg: AdminChatMessage) => void;
  onDelete: (payload: ChatDeletePayload) => void;
  onCleared: (groupId: number) => void;
  onTyping: (groupId: number, userId: string, isAdmin: boolean) => void;
  onReconnect: () => void;
  groupIds: () => number[];
}

let socket: Socket | null = null;
let connecting = false;
const subscribed = new Set<number>();
let handlers: Handlers | null = null;

const disconnect = (): void => {
  socket?.disconnect();
  socket = null;
  connecting = false;
  subscribed.clear();
};

const subscribeRooms = (ids: number[]): void => {
  if (!socket || !socket.connected) return;
  for (const id of ids) {
    if (subscribed.has(id)) continue;
    socket.emit('chat:subscribe', { groupId: id });
    subscribed.add(id);
  }
};

const connect = async (token: string): Promise<void> => {
  if (socket) {
    if (!socket.connected) socket.connect();
    return;
  }
  if (connecting) return;
  connecting = true;
  const base = getApiBaseUrl();
  const url = base && base !== '' ? base : undefined;
  try {
    const { io } = await import('socket.io-client');
    if (socket) return;
    socket = io(url, {
      path: '/ws/internal',
      transports: ['polling', 'websocket'],
      auth: (cb) => cb({ token: token || undefined }),
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });
    socket.on('chat:new', (msg: AdminChatMessage) => handlers?.onNew(msg));
    socket.on('chat:delete', (payload: ChatDeletePayload) => handlers?.onDelete(payload));
    socket.on('chat:cleared', (payload: { groupId: number }) => handlers?.onCleared(payload.groupId));
    socket.on('chat:typing', (payload: ChatTypingPayload) =>
      handlers?.onTyping(payload.groupId, payload.userId, payload.isAdmin),
    );
    socket.on('connect', () => {
      subscribed.clear();
      if (handlers) {
        subscribeRooms(handlers.groupIds());
        handlers.onReconnect();
      }
    });
  } catch {
    connecting = false;
  } finally {
    connecting = false;
  }
};

interface Options {
  active: boolean;
  token: string;
  groupIds: number[];
  onNew: (msg: AdminChatMessage) => void;
  onDelete: (payload: ChatDeletePayload) => void;
  onCleared: (groupId: number) => void;
  onTyping: (groupId: number, userId: string, isAdmin: boolean) => void;
  onReconnect: () => void;
}

export const emitAdminChatTyping = (groupId: number): void => {
  if (socket && socket.connected) socket.emit('chat:typing', { groupId });
};

export const useAdminChatSocket = (opts: Options): void => {
  const ref = useRef(opts);
  ref.current = opts;
  const idsKey = opts.groupIds.join(',');

  useEffect(() => {
    handlers = {
      onNew: (m) => ref.current.onNew(m),
      onDelete: (p) => ref.current.onDelete(p),
      onCleared: (g) => ref.current.onCleared(g),
      onTyping: (g, u, a) => ref.current.onTyping(g, u, a),
      onReconnect: () => ref.current.onReconnect(),
      groupIds: () => ref.current.groupIds,
    };
  }, []);

  useEffect(() => {
    if (!opts.active || !opts.token) {
      disconnect();
      return;
    }
    void connect(opts.token);
    return () => {
      disconnect();
    };
  }, [opts.active, opts.token]);

  useEffect(() => {
    if (!opts.active || !opts.token || idsKey === '') return;
    subscribeRooms(opts.groupIds);
  }, [opts.active, opts.token, idsKey]);

  useEffect(() => {
    if (!opts.active) return;
    const revive = () => {
      if (document.visibilityState === 'visible' && socket && !socket.connected) {
        socket.connect();
      }
    };
    window.addEventListener('visibilitychange', revive);
    window.addEventListener('online', revive);
    return () => {
      window.removeEventListener('visibilitychange', revive);
      window.removeEventListener('online', revive);
    };
  }, [opts.active]);
};
