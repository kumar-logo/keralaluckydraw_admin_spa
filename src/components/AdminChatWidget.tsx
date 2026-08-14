import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Avatar,
  Button,
  Input,
  List,
  Segmented,
  Select,
  Switch,
  Tag,
  Popconfirm,
  Popover,
  Empty,
  Spin,
  Tooltip,
  theme,
  message,
} from 'antd';
import {
  MessageOutlined,
  CloseOutlined,
  MinusOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  DeleteOutlined,
  StopOutlined,
  PlusOutlined,
  TeamOutlined,
  SettingOutlined,
  SmileOutlined,
  PictureOutlined,
  EnterOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ExpandOutlined,
  CompressOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useAdminStore } from '../store';
import { useAdminChatSocket, emitAdminChatTyping } from '../hooks/useAdminChatSocket';
import {
  getChatSettings,
  updateChatSettings,
  getChatGroups,
  createChatGroup,
  deleteChatGroup,
  getChatMembers,
  addChatMember,
  removeChatMember,
  getChatHistory,
  sendChatMessage,
  uploadChatImage,
  chatMediaUrl,
  deleteChatMessage,
  muteChatUser,
  unmuteChatUser,
  getChatMuted,
  clearChatGroupMessages,
  searchChatUsers,
  type AdminChatGroup,
  type AdminChatMessage,
  type AdminChatSettings,
  type AdminChatMember,
  type AdminChatMuted,
  type ChatUserOption,
} from '../services/chatApi';

const WIDTH = 372;
const HEIGHT = 560;
const TYPING_EMIT_MS = 1500;

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😎', '🥳', '🤔', '😐',
  '😴', '😭', '😡', '👍', '👎', '👏', '🙏', '💪', '🔥', '✨',
  '🎉', '💯', '❤️', '💚', '💙', '💰', '🍀', '🏆', '🚀', '⭐',
  '✅', '❌', '⚠️', '🎁', '👀', '🙌', '🤝', '🎯', '📈', '👋',
];

const highlightMentions = (text: string): (string | { m: string })[] =>
  text.split(/(@[A-Za-z0-9_]+)/g).map((p) => (p.startsWith('@') && p.length > 1 ? { m: p } : p));

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const mergeById = (list: AdminChatMessage[], msg: AdminChatMessage): AdminChatMessage[] => {
  if (list.some((m) => m.id === msg.id)) return list;
  return [...list, msg].sort((a, b) => a.id - b.id);
};

const AdminChatWidget = () => {
  const { admin } = useAdminStore();
  const { token } = theme.useToken();

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [panelMode, setPanelMode] = useState<'normal' | 'max' | 'full'>('normal');
  const [hoverMsg, setHoverMsg] = useState<number | null>(null);
  const [userOpts, setUserOpts] = useState<ChatUserOption[]>([]);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [view, setView] = useState<'chats' | 'manage'>('chats');

  const [groups, setGroups] = useState<AdminChatGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<AdminChatGroup | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [settings, setSettings] = useState<AdminChatSettings>({ enabled: false, blockLinks: true, imageEnabled: true, badWords: '' });
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('public');
  const [muted, setMuted] = useState<AdminChatMuted[]>([]);
  const [membersOf, setMembersOf] = useState<number | null>(null);
  const [members, setMembers] = useState<AdminChatMember[]>([]);
  const [memberInput, setMemberInput] = useState('');
  const [staged, setStaged] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reply, setReply] = useState<AdminChatMessage | null>(null);
  const [typingName, setTypingName] = useState('');

  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeGroupRef = useRef<AdminChatGroup | null>(null);
  const messagesRef = useRef<AdminChatMessage[]>([]);
  const typingRef = useRef(0);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminToken = localStorage.getItem('admin_token') ?? '';

  useEffect(() => {
    setPos({ x: window.innerWidth - WIDTH - 24, y: window.innerHeight - HEIGHT - 24 });
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await getChatGroups());
    } catch {
      return;
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setSettings(await getChatSettings());
    } catch {
      return;
    }
  }, []);

  const loadMuted = useCallback(async () => {
    try {
      setMuted(await getChatMuted());
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadGroups();
    void loadSettings();
  }, [open, loadGroups, loadSettings]);

  const refreshMessages = useCallback(async (groupId: number) => {
    try {
      const rows = await getChatHistory(groupId, 50);
      setMessages(rows);
    } catch {
      return;
    }
  }, []);

  const openGroup = async (group: AdminChatGroup) => {
    setActiveGroup(group);
    setMessages([]);
    setLoadingMsgs(true);
    await refreshMessages(group.id);
    setLoadingMsgs(false);
  };

  useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useAdminChatSocket({
    active: open,
    token: adminToken,
    groupIds: groups.map((g) => g.id),
    onNew: (m) => {
      const cur = activeGroupRef.current;
      if (cur && m.groupId === cur.id) {
        setMessages((prev) => mergeById(prev, m));
        setTypingName('');
      }
    },
    onDelete: (p) => {
      const cur = activeGroupRef.current;
      if (cur && p.groupId === cur.id) setMessages((prev) => prev.filter((x) => x.id !== p.id));
    },
    onCleared: (groupId) => {
      const cur = activeGroupRef.current;
      if (cur && cur.id === groupId) setMessages([]);
    },
    onTyping: (groupId, userId, isAdmin) => {
      const cur = activeGroupRef.current;
      if (!cur || cur.id !== groupId) return;
      const found = messagesRef.current.find((m) => m.userId === userId);
      const name = found && found.senderName !== '' ? found.senderName : isAdmin ? 'Admin' : 'User';
      setTypingName(name);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setTypingName(''), 3500);
    },
    onReconnect: () => {
      const cur = activeGroupRef.current;
      if (cur) void refreshMessages(cur.id);
    },
  });

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const onDragDown = (e: React.PointerEvent) => {
    if (panelMode !== 'normal') return;
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const x = Math.min(Math.max(0, e.clientX - dragRef.current.dx), window.innerWidth - 80);
    const y = Math.min(Math.max(0, e.clientY - dragRef.current.dy), window.innerHeight - 48);
    setPos({ x, y });
  };
  const onDragUp = () => {
    dragRef.current = null;
  };

  const doSend = async () => {
    const value = text.trim();
    const hasImage = staged !== '';
    if ((value === '' && !hasImage) || !activeGroup || sending || uploading) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(activeGroup.id, {
        content: value,
        imageUrl: hasImage ? staged : undefined,
        replyToId: reply ? reply.id : undefined,
      });
      setText('');
      setStaged('');
      setReply(null);
      setMessages((prev) => mergeById(prev, msg));
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadChatImage(file);
      setStaged(res.url);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void doUpload(file);
    e.target.value = '';
  };

  const onPasteImg = (e: React.ClipboardEvent) => {
    if (!settings.imageEnabled) return;
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (file) {
      e.preventDefault();
      void doUpload(file);
    }
  };

  const emitTyping = () => {
    if (!activeGroup) return;
    const now = Date.now();
    if (now - typingRef.current < TYPING_EMIT_MS) return;
    typingRef.current = now;
    emitAdminChatTyping(activeGroup.id);
  };

  const insertEmoji = (emoji: string) => setText((t) => t + emoji);

  const doDelete = async (id: number) => {
    try {
      await deleteChatMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const doMute = async (userId: string) => {
    try {
      await muteChatUser(userId, 60, 'Muted from chat window');
      message.success('User muted for 60 min');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const saveSettings = async () => {
    try {
      const next = await updateChatSettings(settings);
      setSettings(next);
      message.success('Chat settings saved');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const doCreateGroup = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createChatGroup(name, newType, '');
      setNewName('');
      message.success('Group created');
      await loadGroups();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const doDeleteGroup = async (id: number) => {
    try {
      await deleteChatGroup(id);
      await loadGroups();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const openMembers = async (id: number) => {
    setMembersOf(id);
    try {
      setMembers(await getChatMembers(id));
    } catch {
      setMembers([]);
    }
  };

  const doAddMember = async () => {
    const uid = memberInput.trim();
    if (!uid || membersOf === null) return;
    try {
      await addChatMember(membersOf, uid);
      setMemberInput('');
      setUserOpts([]);
      setMembers(await getChatMembers(membersOf));
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const onUserSearch = (q: string) => {
    const query = q.trim();
    if (query === '') {
      setUserOpts([]);
      return;
    }
    searchChatUsers(query)
      .then(setUserOpts)
      .catch(() => setUserOpts([]));
  };

  const doClearGroup = async () => {
    if (!activeGroup) return;
    try {
      await clearChatGroupMessages(activeGroup.id);
      setMessages([]);
      message.success('Messages cleared');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const doRemoveMember = async (uid: string) => {
    if (membersOf === null) return;
    try {
      await removeChatMember(membersOf, uid);
      setMembers(await getChatMembers(membersOf));
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const doUnmute = async (userId: string) => {
    try {
      await unmuteChatUser(userId);
      await loadMuted();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (!admin) return null;

  if (!open || minimized) {
    return (
      <Tooltip title="Community Chat" placement="left">
        <Button
          type="primary"
          shape="circle"
          icon={<MessageOutlined />}
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            width: 54,
            height: 54,
            zIndex: 900,
            boxShadow: '0 6px 18px rgba(0,0,0,.28)',
          }}
        />
      </Tooltip>
    );
  }

  const modeGeometry: Record<'normal' | 'max' | 'full', React.CSSProperties> = {
    normal: {
      left: pos.x,
      top: pos.y,
      width: WIDTH,
      height: HEIGHT,
      maxWidth: 'calc(100vw - 16px)',
      maxHeight: 'calc(100vh - 16px)',
      borderRadius: 14,
    },
    max: {
      left: 8,
      top: 8,
      width: 'calc(100vw - 16px)',
      height: 'calc(100vh - 16px)',
      borderRadius: 8,
    },
    full: {
      left: 0,
      top: 0,
      width: '100vw',
      height: '100vh',
      borderRadius: 0,
    },
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 900,
    display: 'flex',
    flexDirection: 'column',
    background: token.colorBgElevated,
    border: `1px solid ${token.colorBorderSecondary}`,
    overflow: 'hidden',
    boxShadow: token.boxShadowSecondary,
    ...modeGeometry[panelMode],
  };

  return (
    <div style={panelStyle}>
      <div
        onPointerDown={onDragDown}
        onPointerMove={onDragMove}
        onPointerUp={onDragUp}
        style={{
          height: 48,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 10px',
          background: token.colorPrimary,
          color: '#fff',
          cursor: panelMode === 'normal' ? 'move' : 'default',
          touchAction: 'none',
        }}
      >
        {view === 'chats' && activeGroup ? (
          <Button
            type="text"
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => setActiveGroup(null)}
            style={{ color: '#fff' }}
          />
        ) : (
          <MessageOutlined style={{ fontSize: 16 }} />
        )}
        <span style={{ fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {view === 'manage' ? 'Manage Chat' : activeGroup ? activeGroup.name : 'Community Chat'}
        </span>
        {view === 'chats' && activeGroup && (
          <Popconfirm
            title="Clear all messages in this group?"
            onConfirm={() => void doClearGroup()}
            okText="Clear"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Clear all messages">
              <Button type="text" size="small" icon={<ClearOutlined />} style={{ color: '#fff' }} />
            </Tooltip>
          </Popconfirm>
        )}
        <Tooltip title="Minimize">
          <Button type="text" size="small" icon={<MinusOutlined />} onClick={() => setMinimized(true)} style={{ color: '#fff' }} />
        </Tooltip>
        <Tooltip title={panelMode === 'max' ? 'Restore' : 'Maximize'}>
          <Button
            type="text"
            size="small"
            icon={panelMode === 'max' ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={() => setPanelMode((m) => (m === 'max' ? 'normal' : 'max'))}
            style={{ color: '#fff' }}
          />
        </Tooltip>
        <Tooltip title={panelMode === 'full' ? 'Exit full screen' : 'Full screen'}>
          <Button
            type="text"
            size="small"
            icon={panelMode === 'full' ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={() => setPanelMode((m) => (m === 'full' ? 'normal' : 'full'))}
            style={{ color: '#fff' }}
          />
        </Tooltip>
        <Tooltip title="Close">
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setOpen(false)} style={{ color: '#fff' }} />
        </Tooltip>
      </div>

      {!minimized && (
        <>
          <div style={{ padding: 8, flexShrink: 0, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
            <Segmented
              block
              size="small"
              value={view}
              onChange={(v) => {
                const nv = v as 'chats' | 'manage';
                setView(nv);
                if (nv === 'manage') {
                  void loadMuted();
                  void loadSettings();
                }
              }}
              options={[
                { label: 'Chats', value: 'chats', icon: <MessageOutlined /> },
                { label: 'Manage', value: 'manage', icon: <SettingOutlined /> },
              ]}
            />
          </div>

          {view === 'chats' ? (
            !activeGroup ? (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {groups.length === 0 ? (
                  <Empty style={{ marginTop: 60 }} description="No groups" />
                ) : (
                  <List
                    dataSource={groups}
                    renderItem={(g) => (
                      <List.Item style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => void openGroup(g)}>
                        <List.Item.Meta
                          avatar={<Avatar src={g.avatar || undefined}>{g.name.charAt(0).toUpperCase()}</Avatar>}
                          title={
                            <span>
                              {g.name}{' '}
                              {g.type === 'private' && <Tag color="orange" style={{ marginLeft: 4 }}>Private</Tag>}
                            </span>
                          }
                          description={g.type === 'private' ? `${g.memberCount ?? 0} members` : 'Public group'}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            ) : (
              <>
                <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', background: token.colorFillQuaternary }}>
                  {loadingMsgs ? (
                    <div style={{ textAlign: 'center', marginTop: 40 }}>
                      <Spin />
                    </div>
                  ) : messages.length === 0 ? (
                    <Empty style={{ marginTop: 40 }} description="No messages" />
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.senderRole === 'admin';
                      const img = m.imageUrl;
                      const rt = m.replyTo;
                      return (
                        <div
                          key={m.id}
                          style={{ marginBottom: 10 }}
                          onMouseEnter={() => setHoverMsg(m.id)}
                          onMouseLeave={() => setHoverMsg((h) => (h === m.id ? null : h))}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: isAdmin ? token.colorWarning : token.colorPrimary }}>
                              {m.senderName || 'Player'}
                            </span>
                            {isAdmin && <Tag color="gold" style={{ margin: 0, fontSize: 9, lineHeight: '16px' }}>Admin</Tag>}
                            <span style={{ fontSize: 10, color: token.colorTextTertiary }}>{formatTime(m.createdAt)}</span>
                            <span style={{ flex: 1 }} />
                            {hoverMsg === m.id && (
                              <>
                                <Button type="text" size="small" icon={<EnterOutlined />} style={{ color: token.colorTextTertiary }} onClick={() => setReply(m)} />
                                <Popconfirm title="Delete message?" onConfirm={() => void doDelete(m.id)} okText="Delete" okButtonProps={{ danger: true }}>
                                  <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: token.colorTextTertiary }} />
                                </Popconfirm>
                                {!isAdmin && (
                                  <Popconfirm title="Mute this user for 60 min?" onConfirm={() => void doMute(m.userId)} okText="Mute">
                                    <Button type="text" size="small" icon={<StopOutlined />} style={{ color: token.colorTextTertiary }} />
                                  </Popconfirm>
                                )}
                              </>
                            )}
                          </div>
                          <div
                            style={{
                              display: 'inline-block',
                              padding: '6px 10px',
                              borderRadius: 10,
                              fontSize: 13,
                              background: isAdmin ? token.colorWarningBg : token.colorBgContainer,
                              border: `1px solid ${token.colorBorderSecondary}`,
                              wordBreak: 'break-word',
                              maxWidth: '100%',
                            }}
                          >
                            {rt && (
                              <div style={{ borderLeft: `3px solid ${token.colorPrimary}`, paddingLeft: 6, marginBottom: 4, opacity: 0.8, fontSize: 12 }}>
                                <div style={{ fontWeight: 600 }}>{rt.senderName || 'Player'}</div>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                                  {rt.imageUrl && !rt.content ? 'Photo' : rt.content}
                                </div>
                              </div>
                            )}
                            {img && (
                              <img
                                src={chatMediaUrl(img)}
                                alt=""
                                style={{ display: 'block', maxWidth: 200, maxHeight: 200, borderRadius: 8, marginBottom: m.content ? 4 : 0, cursor: 'pointer' }}
                                onClick={() => window.open(chatMediaUrl(img), '_blank', 'noopener')}
                              />
                            )}
                            {m.content && (
                              <span style={{ whiteSpace: 'pre-wrap' }}>
                                {highlightMentions(m.content).map((p, i) =>
                                  typeof p === 'string'
                                    ? <span key={i}>{p}</span>
                                    : <span key={i} style={{ color: token.colorPrimary, fontWeight: 600 }}>{p.m}</span>,
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {typingName !== '' && (
                  <div style={{ padding: '2px 12px', fontSize: 12, color: token.colorTextTertiary, flexShrink: 0 }}>
                    {typingName} is typing…
                  </div>
                )}
                {reply && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderTop: `1px solid ${token.colorBorderSecondary}`, flexShrink: 0 }}>
                    <div style={{ flex: 1, minWidth: 0, borderLeft: `3px solid ${token.colorPrimary}`, paddingLeft: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: token.colorPrimary }}>{reply.senderName || 'Player'}</div>
                      <div style={{ fontSize: 12, color: token.colorTextTertiary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {reply.imageUrl && !reply.content ? 'Photo' : reply.content}
                      </div>
                    </div>
                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setReply(null)} />
                  </div>
                )}
                {staged !== '' && (
                  <div style={{ position: 'relative', width: 'fit-content', padding: '8px 10px 0', flexShrink: 0 }}>
                    <img src={chatMediaUrl(staged)} alt="" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, display: 'block' }} />
                    <Button type="primary" danger size="small" shape="circle" icon={<CloseOutlined />} style={{ position: 'absolute', top: 4, right: 6, width: 22, height: 22, minWidth: 22 }} onClick={() => setStaged('')} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: 10, flexShrink: 0, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                  <Popover
                    trigger="click"
                    placement="topLeft"
                    content={
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, width: 280 }}>
                        {EMOJIS.map((e) => (
                          <Button key={e} type="text" style={{ fontSize: 20, padding: 0, height: 34 }} onClick={() => insertEmoji(e)}>{e}</Button>
                        ))}
                      </div>
                    }
                  >
                    <Button type="text" icon={<SmileOutlined />} />
                  </Popover>
                  {settings.imageEnabled && (
                    <Button type="text" icon={uploading ? <Spin size="small" /> : <PictureOutlined />} onClick={() => fileRef.current?.click()} />
                  )}
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onFile} />
                  <Input.TextArea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      emitTyping();
                    }}
                    onPaste={onPasteImg}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        void doSend();
                      }
                    }}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    maxLength={1000}
                    placeholder="Message as admin"
                  />
                  <Button type="primary" icon={<SendOutlined />} loading={sending} disabled={uploading} onClick={() => void doSend()} />
                </div>
              </>
            )
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Settings</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span>Enable group chat</span>
                  <Switch checked={settings.enabled} onChange={(v) => setSettings((s) => ({ ...s, enabled: v }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span>Auto-block links</span>
                  <Switch checked={settings.blockLinks} onChange={(v) => setSettings((s) => ({ ...s, blockLinks: v }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span>Allow image sharing</span>
                  <Switch checked={settings.imageEnabled} onChange={(v) => setSettings((s) => ({ ...s, imageEnabled: v }))} />
                </div>
                <Input.TextArea
                  value={settings.badWords}
                  onChange={(e) => setSettings((s) => ({ ...s, badWords: e.target.value }))}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  placeholder="Bad words (comma or newline separated)"
                  style={{ marginBottom: 8 }}
                />
                <Button type="primary" block onClick={() => void saveSettings()}>
                  Save Settings
                </Button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Create Group</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name" maxLength={100} />
                  <Select
                    value={newType}
                    onChange={setNewType}
                    style={{ width: 110 }}
                    options={[
                      { label: 'Public', value: 'public' },
                      { label: 'Private', value: 'private' },
                    ]}
                  />
                </div>
                <Button icon={<PlusOutlined />} block onClick={() => void doCreateGroup()}>
                  Create
                </Button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Groups</div>
                <List
                  size="small"
                  dataSource={groups}
                  renderItem={(g) => (
                    <List.Item
                      style={{ padding: '6px 0' }}
                      actions={[
                        ...(g.type === 'private'
                          ? [
                              <Button key="m" type="text" size="small" icon={<TeamOutlined />} onClick={() => void openMembers(g.id)} />,
                            ]
                          : []),
                        <Popconfirm key="d" title="Delete group?" onConfirm={() => void doDeleteGroup(g.id)} okText="Delete" okButtonProps={{ danger: true }}>
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>,
                      ]}
                    >
                      <span>
                        {g.name} {g.type === 'private' && <Tag color="orange">Private</Tag>}
                      </span>
                    </List.Item>
                  )}
                />
                {membersOf !== null && (
                  <div style={{ marginTop: 8, padding: 8, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>Members</span>
                      <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setMembersOf(null)} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <Select
                        showSearch
                        size="small"
                        style={{ flex: 1 }}
                        value={memberInput === '' ? undefined : memberInput}
                        placeholder="Search users to add"
                        filterOption={false}
                        onSearch={onUserSearch}
                        onChange={(v: string) => setMemberInput(v)}
                        notFoundContent={null}
                        options={userOpts.map((u) => ({
                          value: u.userId,
                          label: `${u.nickname !== '' ? u.nickname : u.userId} (${u.phone !== '' ? u.phone : u.userId})`,
                        }))}
                      />
                      <Button size="small" type="primary" disabled={memberInput === ''} onClick={() => void doAddMember()}>
                        Add
                      </Button>
                    </div>
                    <List
                      size="small"
                      dataSource={members}
                      locale={{ emptyText: 'No members' }}
                      renderItem={(mem) => (
                        <List.Item
                          style={{ padding: '4px 0' }}
                          actions={[
                            <Button key="r" type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => void doRemoveMember(mem.userId)} />,
                          ]}
                        >
                          <span style={{ fontSize: 12 }}>
                            {mem.nickname || mem.userId} <span style={{ color: token.colorTextTertiary }}>({mem.userId})</span>
                          </span>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Muted Users</div>
                <List
                  size="small"
                  dataSource={muted}
                  locale={{ emptyText: 'None' }}
                  renderItem={(m) => (
                    <List.Item
                      style={{ padding: '6px 0' }}
                      actions={[
                        <Button key="u" size="small" onClick={() => void doUnmute(m.userId)}>
                          Unmute
                        </Button>,
                      ]}
                    >
                      <span style={{ fontSize: 12 }}>
                        {m.userId}
                        <span style={{ color: token.colorTextTertiary, marginLeft: 6 }}>
                          {m.mutedUntil ? `until ${new Date(m.mutedUntil).toLocaleString()}` : 'permanent'}
                        </span>
                      </span>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminChatWidget;
