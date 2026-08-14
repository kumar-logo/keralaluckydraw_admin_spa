import api from './api';
import { getApiBaseUrl } from '../config/env';

export interface ReplySnippet {
  id: number;
  senderName: string;
  content: string;
  imageUrl: string | null;
}

export interface AdminChatGroup {
  id: number;
  name: string;
  type: string;
  avatar: string;
  sortOrder: number;
  memberCount: number | null;
}

export interface AdminChatMessage {
  id: number;
  groupId: number;
  userId: string;
  senderRole: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  imageUrl: string | null;
  replyToId: number | null;
  replyTo: ReplySnippet | null;
  mentions: string[];
  createdAt: string;
}

export interface AdminChatSettings {
  enabled: boolean;
  blockLinks: boolean;
  imageEnabled: boolean;
  badWords: string;
}

export interface AdminSendPayload {
  content: string;
  imageUrl?: string;
  replyToId?: number;
  mentions?: string[];
}

export const chatMediaUrl = (path: string): string => {
  const base = getApiBaseUrl();
  return base && base !== '' ? `${base}${path}` : path;
};

export interface AdminChatMember {
  userId: string;
  nickname: string;
  avatar: string;
  addedAt: string;
}

export interface AdminChatMuted {
  userId: string;
  mutedUntil: string | null;
  reason: string;
  createdAt: string;
}

export const getChatSettings = () =>
  api.get<unknown, AdminChatSettings>('chat/settings');

export const updateChatSettings = (data: {
  enabled?: boolean;
  blockLinks?: boolean;
  imageEnabled?: boolean;
  badWords?: string;
}) => api.post<unknown, AdminChatSettings>('chat/settings', data);

export const getChatGroups = () =>
  api.get<unknown, AdminChatGroup[]>('chat/groups');

export const createChatGroup = (name: string, type: string, avatar: string) =>
  api.post<unknown, { id: number }>('chat/groups', { name, type, avatar });

export const updateChatGroup = (
  id: number,
  data: { name?: string; type?: string; avatar?: string; sortOrder?: number },
) => api.post<unknown, { success: boolean }>(`chat/groups/${id}`, data);

export const deleteChatGroup = (id: number) =>
  api.delete<unknown, { success: boolean }>(`chat/groups/${id}`);

export const getChatMembers = (id: number) =>
  api.get<unknown, AdminChatMember[]>(`chat/groups/${id}/members`, {
    params: { skip: 0, take: 200 },
  });

export const addChatMember = (groupId: number, userId: string) =>
  api.post<unknown, { success: boolean }>('chat/members/add', { groupId, userId });

export const removeChatMember = (groupId: number, userId: string) =>
  api.post<unknown, { success: boolean }>('chat/members/remove', { groupId, userId });

export const getChatHistory = (groupId: number, limit: number) =>
  api.post<unknown, AdminChatMessage[]>('chat/history', { groupId, limit });

export const sendChatMessage = (groupId: number, payload: AdminSendPayload) =>
  api.post<unknown, AdminChatMessage>('chat/send', { groupId, ...payload });

export interface ChatUserOption {
  userId: string;
  nickname: string;
  phone: string;
}

export const searchChatUsers = (search: string) =>
  api
    .post<unknown, { list: ChatUserOption[] }>('users/list', {
      pageNo: 1,
      pageSize: 20,
      search,
    })
    .then((r) => r.list);

export const uploadChatImage = async (file: File): Promise<{ url: string }> => {
  const form = new FormData();
  form.append('file', file);
  const token = localStorage.getItem('admin_token') ?? '';
  const base = getApiBaseUrl();
  const origin = base && base !== '' ? base : '';
  const res = await fetch(`${origin}/admin/api/v1/chat/upload`, {
    method: 'POST',
    headers: { Token: token },
    body: form,
  });
  const json = (await res.json()) as { code: number; msg?: string; data: { url: string } };
  if (json.code !== 0) {
    throw new Error(typeof json.msg === 'string' ? json.msg : 'Upload failed');
  }
  return json.data;
};

export const deleteChatMessage = (id: number) =>
  api.delete<unknown, { success: boolean }>(`chat/message/${id}`);

export const clearChatGroupMessages = (groupId: number) =>
  api.delete<unknown, { success: boolean }>(`chat/group/${groupId}/messages`);

export const muteChatUser = (userId: string, minutes: number | undefined, reason: string) =>
  api.post<unknown, { success: boolean }>('chat/mute', { userId, minutes, reason });

export const unmuteChatUser = (userId: string) =>
  api.post<unknown, { success: boolean }>('chat/unmute', { userId });

export const getChatMuted = () =>
  api.get<unknown, AdminChatMuted[]>('chat/muted', { params: { skip: 0, take: 200 } });
