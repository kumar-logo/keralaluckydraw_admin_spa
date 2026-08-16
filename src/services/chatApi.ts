import api from './api';
import { getApiBaseUrl } from '../config/env';

export enum MessageKind {
  Text = 'text',
  Image = 'image',
  Voice = 'voice',
  System = 'system',
}

export enum SenderRole {
  User = 'user',
  Admin = 'admin',
}

export enum GroupType {
  Public = 'public',
  Private = 'private',
}

export enum JoinPolicy {
  Auto = 'auto',
  Open = 'open',
  Invite = 'invite',
}

export enum Visibility {
  Listed = 'listed',
  Unlisted = 'unlisted',
}

export enum PostPolicy {
  All = 'all',
  AdminOnly = 'admin_only',
}

export enum DmScope {
  Mine = 'mine',
  Queue = 'queue',
}

export interface ReplySnippet {
  id: number;
  senderName: string;
  content: string;
  imageUrl: string | null;
  kind: string;
  audioUrl: string | null;
  durationMs: number | null;
  audioWaveform: string | null;
}

export interface AdminChatGroup {
  id: number;
  name: string;
  type: string;
  avatar: string;
  description: string;
  sortOrder: number;
  joinPolicy: string;
  postPolicy: string;
  visibility: string;
  isDm: boolean;
  memberCount: number | null;
}

export interface AdminChatMessage {
  id: number;
  groupId: number;
  userId: string;
  senderRole: string;
  senderName: string;
  senderAvatar: string;
  kind: string;
  content: string;
  imageUrl: string | null;
  audioUrl: string | null;
  durationMs: number | null;
  audioWaveform: string | null;
  replyToId: number | null;
  replyTo: ReplySnippet | null;
  mentions: string[];
  createdAt: string;
}

export interface AdminChatSettings {
  enabled: boolean;
  blockLinks: boolean;
  imageEnabled: boolean;
  voiceEnabled: boolean;
  dmEnabled: boolean;
  badWords: string;
}

export interface AdminSendPayload {
  content: string;
  imageUrl?: string;
  replyToId?: number;
  mentions?: string[];
  kind?: MessageKind;
  audioUrl?: string;
  durationMs?: number;
  audioWaveform?: string;
}

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

export interface DmPeer {
  kind: string;
  id: string | null;
  name: string;
  avatar: string;
}

export interface LastMessagePreview {
  content: string;
  imageUrl: string | null;
  senderName: string;
  createdAt: string;
  kind: string;
}

export interface AdminDmItem {
  id: number;
  dmKey: string | null;
  isDm: true;
  claimed: boolean;
  peer: DmPeer;
  unread: number;
  lastMessage: LastMessagePreview | null;
}

export interface AdminDmPage {
  items: AdminDmItem[];
  nextCursor: string | null;
}

export interface ChatUserOption {
  userId: string;
  nickname: string;
  phone: string;
}

export interface UpdateGroupPayload {
  name?: string;
  type?: string;
  avatar?: string;
  sortOrder?: number;
  joinPolicy?: JoinPolicy;
  postPolicy?: PostPolicy;
  visibility?: Visibility;
  description?: string;
}

export const chatMediaUrl = (path: string): string => {
  const base = getApiBaseUrl();
  return base !== '' ? `${base}${path}` : path;
};

const nativeUpload = async (
  endpoint: string,
  file: File,
): Promise<{ url: string }> => {
  const form = new FormData();
  form.append('file', file);
  const stored = localStorage.getItem('admin_token');
  const token = stored === null ? '' : stored;
  const base = getApiBaseUrl();
  const origin = base !== '' ? base : '';
  const res = await fetch(`${origin}/admin/api/v1/chat/${endpoint}`, {
    method: 'POST',
    headers: { Token: token },
    body: form,
  });
  const json = (await res.json()) as {
    code: number;
    msg?: string;
    data: { url: string };
  };
  if (json.code !== 0) {
    throw new Error(typeof json.msg === 'string' ? json.msg : 'Upload failed');
  }
  return json.data;
};

export const getChatSettings = () =>
  api.get<unknown, AdminChatSettings>('chat/settings');

export const updateChatSettings = (data: {
  enabled?: boolean;
  blockLinks?: boolean;
  imageEnabled?: boolean;
  voiceEnabled?: boolean;
  dmEnabled?: boolean;
  badWords?: string;
}) => api.post<unknown, AdminChatSettings>('chat/settings', data);

export const getChatGroups = () =>
  api.get<unknown, AdminChatGroup[]>('chat/groups');

export const createChatGroup = (
  name: string,
  type: string,
  avatar: string,
  postPolicy: PostPolicy,
) =>
  api.post<unknown, { id: number }>('chat/groups', {
    name,
    type,
    avatar,
    postPolicy,
  });

export const updateChatGroup = (id: number, data: UpdateGroupPayload) =>
  api.post<unknown, { success: boolean }>(`chat/groups/${id}`, data);

export const deleteChatGroup = (id: number) =>
  api.delete<unknown, { success: boolean }>(`chat/groups/${id}`);

export const getChatMembers = (id: number) =>
  api.get<unknown, AdminChatMember[]>(`chat/groups/${id}/members`, {
    params: { skip: 0, take: 200 },
  });

export const addChatMember = (groupId: number, userId: string) =>
  api.post<unknown, { success: boolean }>('chat/members/add', {
    groupId,
    userId,
  });

export const removeChatMember = (groupId: number, userId: string) =>
  api.post<unknown, { success: boolean }>('chat/members/remove', {
    groupId,
    userId,
  });

export const getChatHistory = (
  groupId: number,
  limit: number,
  beforeId?: number,
) =>
  api.post<unknown, AdminChatMessage[]>('chat/history', {
    groupId,
    limit,
    beforeId,
  });

export const sendChatMessage = (groupId: number, payload: AdminSendPayload) =>
  api.post<unknown, AdminChatMessage>('chat/send', { groupId, ...payload });

export const searchChatUsers = (search: string) =>
  api
    .post<unknown, { list: ChatUserOption[] }>('users/list', {
      pageNo: 1,
      pageSize: 20,
      search,
    })
    .then((r) => r.list);

export const uploadChatImage = (file: File): Promise<{ url: string }> =>
  nativeUpload('upload', file);

export const uploadChatAudio = (file: File): Promise<{ url: string }> =>
  nativeUpload('voice', file);

export const uploadGroupAvatar = (file: File): Promise<{ url: string }> =>
  nativeUpload('group-avatar', file);

export const deleteChatMessage = (id: number) =>
  api.delete<unknown, { success: boolean }>(`chat/message/${id}`);

export const clearChatGroupMessages = (groupId: number) =>
  api.delete<unknown, { success: boolean }>(`chat/group/${groupId}/messages`);

export const muteChatUser = (
  userId: string,
  minutes: number | undefined,
  reason: string,
) => api.post<unknown, { success: boolean }>('chat/mute', { userId, minutes, reason });

export const unmuteChatUser = (userId: string) =>
  api.post<unknown, { success: boolean }>('chat/unmute', { userId });

export const getChatMuted = () =>
  api.get<unknown, AdminChatMuted[]>('chat/muted', {
    params: { skip: 0, take: 200 },
  });

export const getAdminDms = (scope: DmScope, cursor?: string) =>
  api.get<unknown, AdminDmPage>('chat/dms', {
    params: cursor === undefined ? { scope } : { scope, cursor },
  });

export const openAdminDm = (userId: string) =>
  api.post<unknown, AdminDmItem>('chat/dm/open', { userId });

export const claimAdminDm = (id: number) =>
  api.post<unknown, { success: boolean; groupId: number }>(
    `chat/dm/${id}/claim`,
    {},
  );
