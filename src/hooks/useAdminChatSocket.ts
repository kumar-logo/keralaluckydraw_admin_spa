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

export interface ChatDeliveredPayload {
  groupId: number;
  userId: string;
  lastDeliveredId: number;
}

export interface ChatReadPayload {
  groupId: number;
  userId: string;
  lastReadId: number;
  name: string;
  avatar: string;
}

export interface ChatGroupUpdatePayload {
  groupId: number;
  name: string;
  avatar: string;
  description: string;
  type: string;
  joinPolicy: string;
  postPolicy: string;
  visibility: string;
}

export interface ChatDmCreatedPayload {
  groupId: number;
  dmKey: string;
  userId: string;
  scope: string;
}

export interface ChatDmClaimedPayload {
  groupId: number;
  adminId: string;
}

export interface ChatMentionBadgePayload {
  groupId: number;
}

interface Handlers {
  onNew: (msg: AdminChatMessage) => void;
  onDelete: (payload: ChatDeletePayload) => void;
  onCleared: (groupId: number) => void;
  onTyping: (groupId: number, userId: string, isAdmin: boolean) => void;
  onDelivered: (payload: ChatDeliveredPayload) => void;
  onRead: (payload: ChatReadPayload) => void;
  onGroupUpdate: (payload: ChatGroupUpdatePayload) => void;
  onDmCreated: (payload: ChatDmCreatedPayload) => void;
  onDmClaimed: (payload: ChatDmClaimedPayload) => void;
  onMentionBadge: (payload: ChatMentionBadgePayload) => void;
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
  const url = base !== '' ? base : undefined;
  try {
    const { io } = await import('socket.io-client');
    if (socket) return;
    socket = io(url, {
      path: '/ws/internal',
      transports: ['polling', 'websocket'],
      auth: (cb) => cb({ token: token === '' ? undefined : token }),
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });
    socket.on('chat:new', (msg: AdminChatMessage) => handlers?.onNew(msg));
    socket.on('chat:delete', (payload: ChatDeletePayload) =>
      handlers?.onDelete(payload),
    );
    socket.on('chat:cleared', (payload: { groupId: number }) =>
      handlers?.onCleared(payload.groupId),
    );
    socket.on('chat:typing', (payload: ChatTypingPayload) =>
      handlers?.onTyping(payload.groupId, payload.userId, payload.isAdmin),
    );
    socket.on('chat:delivered', (payload: ChatDeliveredPayload) =>
      handlers?.onDelivered(payload),
    );
    socket.on('chat:read', (payload: ChatReadPayload) =>
      handlers?.onRead(payload),
    );
    socket.on('chat:group_update', (payload: ChatGroupUpdatePayload) =>
      handlers?.onGroupUpdate(payload),
    );
    socket.on('chat:dm_created', (payload: ChatDmCreatedPayload) =>
      handlers?.onDmCreated(payload),
    );
    socket.on('chat:dm_claimed', (payload: ChatDmClaimedPayload) =>
      handlers?.onDmClaimed(payload),
    );
    socket.on('chat:mention_badge', (payload: ChatMentionBadgePayload) =>
      handlers?.onMentionBadge(payload),
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
  onDelivered: (payload: ChatDeliveredPayload) => void;
  onRead: (payload: ChatReadPayload) => void;
  onGroupUpdate: (payload: ChatGroupUpdatePayload) => void;
  onDmCreated: (payload: ChatDmCreatedPayload) => void;
  onDmClaimed: (payload: ChatDmClaimedPayload) => void;
  onMentionBadge: (payload: ChatMentionBadgePayload) => void;
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
      onDelivered: (p) => ref.current.onDelivered(p),
      onRead: (p) => ref.current.onRead(p),
      onGroupUpdate: (p) => ref.current.onGroupUpdate(p),
      onDmCreated: (p) => ref.current.onDmCreated(p),
      onDmClaimed: (p) => ref.current.onDmClaimed(p),
      onMentionBadge: (p) => ref.current.onMentionBadge(p),
      onReconnect: () => ref.current.onReconnect(),
      groupIds: () => ref.current.groupIds,
    };
  }, []);

  useEffect(() => {
    if (!opts.active || opts.token === '') {
      disconnect();
      return;
    }
    void connect(opts.token);
    return () => {
      disconnect();
    };
  }, [opts.active, opts.token]);

  useEffect(() => {
    if (!opts.active || opts.token === '' || idsKey === '') return;
    subscribeRooms(opts.groupIds);
  }, [opts.active, opts.token, idsKey]);

  useEffect(() => {
    if (!opts.active) return;
    const revive = () => {
      if (
        document.visibilityState === 'visible' &&
        socket &&
        !socket.connected
      ) {
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
