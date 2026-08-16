import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Badge,
  Button,
  Dropdown,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Segmented,
  Select,
  Switch,
  Tooltip,
  message,
  type MenuProps,
} from 'antd';
import {
  MinusOutlined,
  CloseOutlined,
  ExpandOutlined,
  CompressOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  ClearOutlined,
  EditOutlined,
  UserAddOutlined,
  TeamOutlined,
  PlusOutlined,
  DeleteOutlined,
  StopOutlined,
  EnterOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useAdminStore } from '../store';
import {
  useAdminChatSocket,
  emitAdminChatTyping,
} from '../hooks/useAdminChatSocket';
import { useVoiceRecorder, type VoiceResult } from '../hooks/useVoiceRecorder';
import {
  getChatSettings,
  updateChatSettings,
  getChatGroups,
  createChatGroup,
  deleteChatGroup,
  updateChatGroup,
  getChatMembers,
  addChatMember,
  removeChatMember,
  getChatHistory,
  sendChatMessage,
  uploadChatImage,
  uploadChatAudio,
  uploadGroupAvatar,
  chatMediaUrl,
  deleteChatMessage,
  muteChatUser,
  unmuteChatUser,
  getChatMuted,
  clearChatGroupMessages,
  searchChatUsers,
  getAdminDms,
  openAdminDm,
  claimAdminDm,
  MessageKind,
  SenderRole,
  GroupType,
  JoinPolicy,
  PostPolicy,
  DmScope,
  type AdminChatGroup,
  type AdminChatMessage,
  type AdminChatSettings,
  type AdminChatMember,
  type AdminChatMuted,
  type AdminDmItem,
  type ChatUserOption,
  type ReplySnippet,
  type LastMessagePreview,
} from '../services/chatApi';
import './chat/admin-chat.css';

const WIDTH = 384;
const HEIGHT = 604;
const TYPING_EMIT_MS = 1500;
const PAGE_SIZE = 30;

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😎', '🥳', '🤔', '😐',
  '😴', '😭', '😡', '👍', '👎', '👏', '🙏', '💪', '🔥', '✨',
  '🎉', '💯', '❤️', '💚', '💙', '💰', '🍀', '🏆', '🚀', '⭐',
  '✅', '❌', '⚠️', '🎁', '👀', '🙌', '🤝', '🎯', '📈', '👋',
];

enum PanelMode {
  Normal = 'normal',
  Max = 'max',
  Full = 'full',
}
enum ListTab {
  Groups = 'groups',
  Dms = 'dms',
  Queue = 'queue',
}
enum ReceiptState {
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
}
enum MsgAction {
  Reply = 'reply',
  Copy = 'copy',
  Mute = 'mute',
  Delete = 'delete',
}

interface ActiveConv {
  id: number;
  title: string;
  avatar: string;
  isDm: boolean;
  type: string;
  subtitle: string;
}

interface Receipt {
  delivered: number;
  read: number;
}

interface Participant {
  userId: string;
  name: string;
  avatar: string;
}

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const VoiceClaimContext = createContext<(el: HTMLAudioElement) => void>(
  () => undefined,
);

const startOfDay = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const dateKey = (iso: string): number => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 0 : startOfDay(d);
};
const dateLabel = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = startOfDay(new Date());
  const that = startOfDay(d);
  if (that === today) return 'Today';
  if (that === today - 86400000) return 'Yesterday';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};
const formatTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};
const fmtDur = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const previewText = (p: LastMessagePreview | null): string => {
  if (p === null) return '';
  if (p.kind === MessageKind.Voice) return 'Voice message';
  if (p.kind === MessageKind.Image && p.content === '') return 'Photo';
  return p.content;
};
const replyPreview = (r: ReplySnippet): string => {
  if (r.kind === MessageKind.Voice) return 'Voice message';
  if (r.imageUrl !== null && r.content === '') return 'Photo';
  return r.content;
};

const avatarSrc = (raw: string): string => {
  if (raw === '') return '';
  if (raw.startsWith('http')) return raw;
  return chatMediaUrl(raw);
};

const sortUniqueById = (rows: AdminChatMessage[]): AdminChatMessage[] => {
  const map = new Map<number, AdminChatMessage>();
  for (const r of rows) map.set(r.id, r);
  return Array.from(map.values()).sort((a, b) => a.id - b.id);
};
const mergeById = (
  list: AdminChatMessage[],
  msg: AdminChatMessage,
): AdminChatMessage[] => {
  if (list.some((m) => m.id === msg.id)) return list;
  return [...list, msg].sort((a, b) => a.id - b.id);
};

const parseWave = (raw: string | null): number[] => {
  if (raw === null || raw === '') return Array.from({ length: 40 }, () => 30);
  const nums: number[] = [];
  for (const part of raw.split(',')) {
    const n = Number(part);
    nums.push(Number.isFinite(n) ? Math.min(100, Math.max(6, n)) : 18);
  }
  if (nums.length === 0) return Array.from({ length: 40 }, () => 30);
  return nums;
};

const ChatGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="9.5" r="1" fill="currentColor" />
    <circle cx="12.5" cy="9.5" r="1" fill="currentColor" />
    <circle cx="16" cy="9.5" r="1" fill="currentColor" />
  </svg>
);
const WhatsAppGlyph = () => (
  <svg viewBox="0 0 32 32" width="26" height="26">
    <path fill="#fff" d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.9 6.5L4 29l7.7-1.8c1.9 1 4 1.6 6.3 1.6 6.6 0 12-5.4 12-12S22.6 3 16 3zm6.9 17.1c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.1-2.1-.1-.5-.1-1.1-.3-1.9-.7-3.4-1.5-5.6-4.9-5.8-5.1-.2-.2-1.4-1.8-1.4-3.5s.9-2.5 1.2-2.8c.3-.3.7-.4.9-.4h.6c.2 0 .5 0 .7.5.3.7.9 2.3 1 2.5.1.2.2.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.5-.6.6-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.7 3 1.9.4.2.6.2.8-.1.2-.3.9-1.1 1.2-1.4.3-.3.5-.3.9-.2.4.1 2.2 1 2.6 1.2.4.2.6.3.7.5.1.2.1.9-.2 1.7z" />
  </svg>
);
const SendGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M4 12l16-8-6 16-3-6-7-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
);
const SmileGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M8.5 14c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><circle cx="9" cy="10" r="1" fill="currentColor" /><circle cx="15" cy="10" r="1" fill="currentColor" /></svg>
);
const AttachGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><circle cx="8.5" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.5" /><path d="M4 17l4.5-4 3 2.5L15 11l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const MicGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
);
const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>
);
const PauseGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
);
const XGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
const SingleTick = ({ color }: { color: string }) => (
  <svg width="15" height="11" viewBox="0 0 16 12" fill="none"><path d="M1 6.2 4.8 10 14.6 1.2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const DoubleTick = ({ color }: { color: string }) => (
  <svg width="18" height="11" viewBox="0 0 20 12" fill="none">
    <path d="M1 6.2 4.6 9.8 12.5 1.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.6 6.6 9.8 9.8 18.8 0.9" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Spinner = ({ size = 26, onPrimary = false }: { size?: number; onPrimary?: boolean }) => (
  <div
    className={onPrimary ? 'adm-spin adm-spin-on-primary' : 'adm-spin'}
    style={{ width: size, height: size }}
  />
);

const Ticks = ({ state }: { state: ReceiptState }) => {
  if (state === ReceiptState.Sent) {
    return <span className="adm-tick"><SingleTick color="var(--adm-tick)" /></span>;
  }
  const color = state === ReceiptState.Read ? '#53bdeb' : 'var(--adm-tick)';
  return <span className="adm-tick"><DoubleTick color={color} /></span>;
};

const Avatar = ({ src, name, size }: { src: string; name: string; size: number }) => {
  const url = avatarSrc(src);
  const initial = (name === '' ? '#' : name).charAt(0).toUpperCase();
  return (
    <div className="adm-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      <span>{initial}</span>
      {url !== '' && (
        <img
          src={url}
          alt={name}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
    </div>
  );
};

const MentionText = ({ text }: { text: string }) => {
  const parts = text.split(/(@[A-Za-z0-9_]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('@') && p.length > 1 ? (
          <span key={i} className="adm-mention">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
};

const VoiceBubble = ({
  src,
  durationMs,
  waveform,
}: {
  src: string;
  durationMs: number | null;
  waveform: string | null;
}) => {
  const claim = useContext(VoiceClaimContext);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [dur, setDur] = useState(
    durationMs !== null && durationMs > 0 ? durationMs : 0,
  );
  const bars = useMemo(() => parseWave(waveform), [waveform]);

  const toggle = () => {
    const a = audioRef.current;
    if (a === null) return;
    if (playing) {
      a.pause();
    } else {
      claim(a);
      void a.play();
    }
  };

  const onWaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (a === null || !Number.isFinite(a.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const r = (e.clientX - rect.left) / rect.width;
    a.currentTime = Math.min(1, Math.max(0, r)) * a.duration;
  };

  const shownMs = playing && dur > 0 ? dur * ratio : dur;

  return (
    <div className="adm-voice">
      <audio
        ref={audioRef}
        src={chatMediaUrl(src)}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setRatio(0);
        }}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && (durationMs === null || durationMs <= 0)) {
            setDur(d * 1000);
          }
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (Number.isFinite(a.duration) && a.duration > 0) {
            setRatio(a.currentTime / a.duration);
          }
        }}
      />
      <button type="button" className="adm-voice-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <PauseGlyph /> : <PlayGlyph />}
      </button>
      <div className="adm-voice-wave" onClick={onWaveClick}>
        {bars.map((h, i) => (
          <span
            key={i}
            className={i / bars.length <= ratio ? 'adm-voice-bar adm-on' : 'adm-voice-bar'}
            style={{ height: `${Math.max(6, h)}%` }}
          />
        ))}
      </div>
      <span className="adm-voice-time">{fmtDur(shownMs)}</span>
    </div>
  );
};

const Bubble = ({
  msg,
  mine,
  isAdmin,
  showReceipts,
  receipt,
  onAction,
  onImage,
  onQuoteClick,
}: {
  msg: AdminChatMessage;
  mine: boolean;
  isAdmin: boolean;
  showReceipts: boolean;
  receipt: Receipt | null;
  onAction: (action: MsgAction, msg: AdminChatMessage) => void;
  onImage: (url: string) => void;
  onQuoteClick: (id: number) => void;
}) => {
  const cls = mine
    ? 'adm-bubble adm-bubble-me'
    : isAdmin
      ? 'adm-bubble adm-bubble-admin'
      : 'adm-bubble adm-bubble-other';
  const reply = msg.replyTo;
  const isVoice = msg.kind === MessageKind.Voice && msg.audioUrl !== null;

  const receiptState: ReceiptState | null =
    mine && showReceipts
      ? receipt === null
        ? ReceiptState.Sent
        : msg.id <= receipt.read
          ? ReceiptState.Read
          : msg.id <= receipt.delivered
            ? ReceiptState.Delivered
            : ReceiptState.Sent
      : null;

  const items: MenuProps['items'] = [
    { key: MsgAction.Reply, label: 'Reply', icon: <EnterOutlined /> },
    ...(msg.content !== ''
      ? [{ key: MsgAction.Copy, label: 'Copy', icon: <CopyOutlined /> }]
      : []),
    ...(msg.senderRole === SenderRole.User
      ? [{ key: MsgAction.Mute, label: 'Mute user', icon: <StopOutlined /> }]
      : []),
    { type: 'divider' as const },
    { key: MsgAction.Delete, label: 'Delete', icon: <DeleteOutlined />, danger: true },
  ];

  return (
    <Dropdown
      trigger={['contextMenu']}
      menu={{ items, onClick: (info) => onAction(info.key as MsgAction, msg) }}
    >
      <div className={cls}>
        {reply !== null && (
          <button type="button" className="adm-quote" onClick={() => onQuoteClick(reply.id)}>
            <span className="adm-quote-name">{reply.senderName === '' ? 'Player' : reply.senderName}</span>
            <span className="adm-quote-text">{replyPreview(reply)}</span>
          </button>
        )}
        {isVoice && msg.audioUrl !== null ? (
          <VoiceBubble src={msg.audioUrl} durationMs={msg.durationMs} waveform={msg.audioWaveform} />
        ) : (
          <>
            {msg.imageUrl !== null && (
              <img
                className="adm-msg-img"
                src={chatMediaUrl(msg.imageUrl)}
                alt=""
                onClick={() => msg.imageUrl !== null && onImage(chatMediaUrl(msg.imageUrl))}
              />
            )}
            {msg.content !== '' && (
              <span className="adm-msg-text"><MentionText text={msg.content} /></span>
            )}
          </>
        )}
        <span className="adm-t">
          {formatTime(msg.createdAt)}
          {receiptState !== null && <Ticks state={receiptState} />}
        </span>
      </div>
    </Dropdown>
  );
};

interface RunBlock {
  kind: 'run';
  key: string;
  mine: boolean;
  isAdmin: boolean;
  name: string;
  items: AdminChatMessage[];
}
interface SepBlock {
  kind: 'sep';
  key: string;
  label: string;
}
type Block = RunBlock | SepBlock;

const buildBlocks = (messages: AdminChatMessage[], adminKey: string): Block[] => {
  const blocks: Block[] = [];
  let lastDay = -1;
  let currentKey = '';
  let run: RunBlock | null = null;
  for (const m of messages) {
    const day = dateKey(m.createdAt);
    if (day !== lastDay) {
      blocks.push({ kind: 'sep', key: `sep-${day}-${m.id}`, label: dateLabel(m.createdAt) });
      lastDay = day;
      currentKey = '';
      run = null;
    }
    const senderKey = `${day}|${m.userId}|${m.senderRole}`;
    if (senderKey !== currentKey || run === null) {
      currentKey = senderKey;
      run = {
        kind: 'run',
        key: `run-${m.id}`,
        mine: m.senderRole === SenderRole.Admin && m.userId === adminKey,
        isAdmin: m.senderRole === SenderRole.Admin && m.userId !== adminKey,
        name: m.senderName,
        items: [],
      };
      blocks.push(run);
    }
    run.items.push(m);
  }
  return blocks;
};

const RunView = ({
  block,
  showReceipts,
  receipt,
  onAction,
  onImage,
  onQuoteClick,
}: {
  block: RunBlock;
  showReceipts: boolean;
  receipt: Receipt | null;
  onAction: (action: MsgAction, msg: AdminChatMessage) => void;
  onImage: (url: string) => void;
  onQuoteClick: (id: number) => void;
}) => {
  if (block.mine) {
    return (
      <div className="adm-run adm-me">
        {block.items.map((m) => (
          <div className="adm-line" key={m.id} data-mid={m.id}>
            <Bubble
              msg={m}
              mine
              isAdmin={false}
              showReceipts={showReceipts}
              receipt={receipt}
              onAction={onAction}
              onImage={onImage}
              onQuoteClick={onQuoteClick}
            />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="adm-run adm-other">
      <div className={block.isAdmin ? 'adm-run-name adm-admin' : 'adm-run-name'}>
        {block.name === '' ? 'Player' : block.name}
        {block.isAdmin && <span className="adm-tag">Admin</span>}
      </div>
      {block.items.map((m, i) => (
        <div className="adm-line" key={m.id} data-mid={m.id}>
          <div className="adm-ava-slot">
            {i === block.items.length - 1 && (
              <Avatar src={m.senderAvatar} name={m.senderName} size={30} />
            )}
          </div>
          <Bubble
            msg={m}
            mine={false}
            isAdmin={block.isAdmin}
            showReceipts={false}
            receipt={null}
            onAction={onAction}
            onImage={onImage}
            onQuoteClick={onQuoteClick}
          />
        </div>
      ))}
    </div>
  );
};

const MessageList = ({
  messages,
  adminKey,
  loading,
  loadingMore,
  showReceipts,
  receipt,
  onReachTop,
  onAction,
  onImage,
}: {
  messages: AdminChatMessage[];
  adminKey: string;
  loading: boolean;
  loadingMore: boolean;
  showReceipts: boolean;
  receipt: Receipt | null;
  onReachTop: () => void;
  onAction: (action: MsgAction, msg: AdminChatMessage) => void;
  onImage: (url: string) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);
  const prevFirstId = useRef<number | null>(null);
  const lastScrollTop = useRef(0);
  const anchor = useRef<{ h: number; t: number } | null>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el === null) return;
    const firstId = messages.length > 0 ? messages[0].id : null;
    const prepended =
      anchor.current !== null &&
      firstId !== prevFirstId.current &&
      messages.length > prevLen.current;
    if (prepended && anchor.current !== null) {
      el.scrollTop = el.scrollHeight - anchor.current.h + anchor.current.t;
      anchor.current = null;
    } else {
      const grewAtEnd =
        messages.length > prevLen.current && prevFirstId.current === firstId;
      if (prevLen.current === 0 || grewAtEnd) {
        bottomRef.current?.scrollIntoView({
          behavior: prevLen.current === 0 ? 'auto' : 'smooth',
        });
      }
    }
    prevLen.current = messages.length;
    prevFirstId.current = firstId;
  }, [messages]);

  const quoteScroll = (id: number) => {
    const el = scrollRef.current?.querySelector(`[data-mid="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (el === null) return;
    const goingUp = el.scrollTop < lastScrollTop.current;
    lastScrollTop.current = el.scrollTop;
    if (el.scrollTop < 48 && goingUp) {
      anchor.current = { h: el.scrollHeight, t: el.scrollTop };
      onReachTop();
    }
  };

  if (loading) {
    return <div className="adm-center"><Spinner size={28} /></div>;
  }

  const blocks = buildBlocks(messages, adminKey);

  return (
    <div ref={scrollRef} onScroll={onScroll} className="adm-msgs">
      {loadingMore && <div className="adm-loadmore"><Spinner size={20} /></div>}
      {messages.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-ic"><ChatGlyph /></div>
          <span className="adm-empty-title">No messages yet</span>
        </div>
      ) : (
        blocks.map((b) =>
          b.kind === 'sep' ? (
            <div className="adm-sep" key={b.key}>{b.label}</div>
          ) : (
            <RunView
              key={b.key}
              block={b}
              showReceipts={showReceipts}
              receipt={receipt}
              onAction={onAction}
              onImage={onImage}
              onQuoteClick={quoteScroll}
            />
          ),
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
};

const Composer = ({
  sending,
  imageEnabled,
  voiceEnabled,
  participants,
  onSendText,
  onSendVoice,
  onTyping,
}: {
  sending: boolean;
  imageEnabled: boolean;
  voiceEnabled: boolean;
  participants: Participant[];
  onSendText: (p: {
    content: string;
    imageUrl?: string;
    mentions?: string[];
  }) => Promise<boolean>;
  onSendVoice: (r: VoiceResult) => Promise<boolean>;
  onTyping: () => void;
}) => {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [staged, setStaged] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const mentionPicks = useRef<Array<{ userId: string; nick: string }>>([]);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder();

  const detectMention = (value: string, caret: number) => {
    const upto = value.slice(0, caret);
    const match = upto.match(/@([A-Za-z0-9_]*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const pickMention = (p: Participant) => {
    const el = areaRef.current;
    const caret = el === null ? text.length : el.selectionStart;
    const upto = text.slice(0, caret);
    const rest = text.slice(caret);
    const replaced = upto.replace(/@([A-Za-z0-9_]*)$/, `@${p.name} `);
    if (
      !mentionPicks.current.some(
        (e) => e.userId === p.userId && e.nick === p.name,
      )
    ) {
      mentionPicks.current.push({ userId: p.userId, nick: p.name });
    }
    setText(replaced + rest);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      if (el !== null) {
        el.focus();
        el.selectionStart = replaced.length;
        el.selectionEnd = replaced.length;
      }
    });
  };

  const resolveMentions = (content: string): string[] => {
    const out: string[] = [];
    for (const { userId, nick } of mentionPicks.current) {
      if (out.includes(userId)) continue;
      const boundary = new RegExp(
        `(?:^|\\s)@${escapeRegExp(nick)}(?![A-Za-z0-9_])`,
      );
      if (boundary.test(content)) out.push(userId);
    }
    return out;
  };

  const suggestions =
    mentionQuery !== null
      ? participants
          .filter((p) =>
            p.name.toLowerCase().startsWith(mentionQuery.toLowerCase()),
          )
          .slice(0, 6)
      : [];

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadChatImage(file);
      setStaged(res.url);
    } catch (err) {
      message.warning(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void doUpload(file);
    e.target.value = '';
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (!imageEnabled) return;
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith('image/'),
    );
    const file = item?.getAsFile();
    if (file) {
      e.preventDefault();
      void doUpload(file);
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = areaRef.current;
    const caret = el === null ? text.length : el.selectionStart;
    const next = text.slice(0, caret) + emoji + text.slice(caret);
    setText(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      if (el !== null) {
        el.focus();
        el.selectionStart = caret + emoji.length;
        el.selectionEnd = caret + emoji.length;
      }
    });
  };

  const submit = async () => {
    const value = text.trim();
    if ((value === '' && staged === '') || sending || uploading) return;
    const ok = await onSendText({
      content: value,
      imageUrl: staged === '' ? undefined : staged,
      mentions: resolveMentions(value),
    });
    if (ok) {
      setText('');
      setStaged('');
      setEmojiOpen(false);
      setMentionQuery(null);
      mentionPicks.current = [];
    }
  };

  const startRecording = async () => {
    try {
      await recorder.start();
    } catch (err) {
      message.warning(err instanceof Error ? err.message : 'Microphone unavailable');
    }
  };

  const finishRecording = async () => {
    const result = await recorder.stop();
    if (result === null) return;
    await onSendVoice(result);
  };

  const showSend = text.trim() !== '' || staged !== '';

  if (recorder.recording) {
    return (
      <div className="adm-composer-wrap">
        <div className="adm-rec">
          <span className="adm-rec-dot" />
          <span className="adm-rec-time">{fmtDur(recorder.seconds * 1000)}</span>
          <button type="button" className="adm-rec-btn adm-rec-cancel" onClick={recorder.cancel} aria-label="Cancel">
            <DeleteOutlined />
          </button>
          <button type="button" className="adm-rec-btn adm-rec-send" onClick={() => void finishRecording()} aria-label="Send voice">
            <SendGlyph />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-composer-wrap">
      {suggestions.length > 0 && (
        <div className="adm-mentions">
          {suggestions.map((p) => (
            <button
              key={p.userId}
              type="button"
              className="adm-mention-item"
              onClick={() => pickMention(p)}
            >
              <Avatar src={p.avatar} name={p.name} size={26} />
              <span>{p.name === '' ? 'Player' : p.name}</span>
            </button>
          ))}
        </div>
      )}
      {staged !== '' && (
        <div className="adm-staged">
          <img src={chatMediaUrl(staged)} alt="" />
          <button type="button" className="adm-staged-x" onClick={() => setStaged('')}><XGlyph /></button>
        </div>
      )}
      <div className="adm-composer">
        <Popover
          trigger="click"
          open={emojiOpen}
          onOpenChange={setEmojiOpen}
          placement="topLeft"
          content={
            <div className="adm-emoji" style={{ width: 288 }}>
              {EMOJIS.map((e) => (
                <button key={e} type="button" className="adm-emoji-item" onClick={() => insertEmoji(e)}>{e}</button>
              ))}
            </div>
          }
        >
          <button type="button" className="adm-comp-btn" aria-label="Emoji"><SmileGlyph /></button>
        </Popover>
        {imageEnabled && (
          <button type="button" className="adm-comp-btn" onClick={() => fileRef.current?.click()} aria-label="Attach">
            {uploading ? <Spinner size={20} /> : <AttachGlyph />}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onFile} />
        <textarea
          ref={areaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            detectMention(
              e.target.value,
              e.target.selectionStart ?? e.target.value.length,
            );
            onTyping();
          }}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="Message as admin"
          className="adm-input"
        />
        {showSend || !voiceEnabled ? (
          <button
            type="button"
            className="adm-send"
            onClick={() => void submit()}
            disabled={sending || uploading || !showSend}
            aria-label="Send"
          >
            {sending ? <Spinner size={20} onPrimary /> : <SendGlyph />}
          </button>
        ) : (
          <button type="button" className="adm-send" onClick={() => void startRecording()} aria-label="Record voice">
            <MicGlyph />
          </button>
        )}
      </div>
    </div>
  );
};

const GroupRow = ({
  group,
  unread,
  mentions,
  onOpen,
  onEdit,
}: {
  group: AdminChatGroup;
  unread: number;
  mentions: number;
  onOpen: () => void;
  onEdit: () => void;
}) => (
  <div className="adm-row" onClick={onOpen}>
    <Avatar src={group.avatar} name={group.name} size={44} />
    <div className="adm-row-main">
      <span className="adm-row-name">
        {group.name}
        {group.type === GroupType.Private && <span className="adm-tag">Private</span>}
      </span>
      <span className="adm-row-sub">
        {group.type === GroupType.Private
          ? `${group.memberCount === null ? 0 : group.memberCount} members`
          : 'Public group'}
      </span>
    </div>
    <div className="adm-row-side">
      {mentions > 0 && <span className="adm-pill-at">@{mentions > 99 ? '99+' : mentions}</span>}
      {unread > 0 && <span className="adm-pill">{unread > 99 ? '99+' : unread}</span>}
    </div>
    <div className="adm-row-actions">
      <Tooltip title="Edit group">
        <button
          type="button"
          className="adm-icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <EditOutlined />
        </button>
      </Tooltip>
    </div>
  </div>
);

const DmRow = ({
  dm,
  unread,
  showClaim,
  onOpen,
  onClaim,
}: {
  dm: AdminDmItem;
  unread: number;
  showClaim: boolean;
  onOpen: () => void;
  onClaim: () => void;
}) => {
  const name = dm.peer.name === '' ? 'User' : dm.peer.name;
  return (
    <div className="adm-row" onClick={onOpen}>
      <Avatar src={dm.peer.avatar} name={name} size={44} />
      <div className="adm-row-main">
        <span className="adm-row-name">{name}</span>
        <span className="adm-row-sub">
          {dm.lastMessage === null ? 'Direct message' : previewText(dm.lastMessage)}
        </span>
      </div>
      <div className="adm-row-side">
        {unread > 0 && <span className="adm-pill">{unread > 99 ? '99+' : unread}</span>}
      </div>
      {showClaim && (
        <div className="adm-row-actions">
          <Button
            size="small"
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              onClaim();
            }}
          >
            Claim
          </Button>
        </div>
      )}
    </div>
  );
};

const AdminChatWidget = () => {
  const { admin } = useAdminStore();
  const adminId = admin === null ? 0 : admin.id;
  const adminKey = `admin_${adminId}`;

  const storedToken = localStorage.getItem('admin_token');
  const adminToken = storedToken === null ? '' : storedToken;

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>(PanelMode.Normal);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [manageOpen, setManageOpen] = useState(false);
  const [listTab, setListTab] = useState<ListTab>(ListTab.Groups);

  const [groups, setGroups] = useState<AdminChatGroup[]>([]);
  const [dmsMine, setDmsMine] = useState<AdminDmItem[]>([]);
  const [dmsQueue, setDmsQueue] = useState<AdminDmItem[]>([]);
  const [active, setActive] = useState<ActiveConv | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<AdminChatMessage | null>(null);
  const [typingName, setTypingName] = useState('');
  const [lightbox, setLightbox] = useState('');

  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  const [mentionMap, setMentionMap] = useState<Record<number, number>>({});
  const [receiptMap, setReceiptMap] = useState<Record<number, Receipt>>({});

  const [settings, setSettings] = useState<AdminChatSettings>({
    enabled: false,
    blockLinks: true,
    imageEnabled: true,
    voiceEnabled: true,
    dmEnabled: true,
    badWords: '',
  });
  const [muted, setMuted] = useState<AdminChatMuted[]>([]);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>(GroupType.Public);
  const [newAdminOnly, setNewAdminOnly] = useState(false);
  const [membersOf, setMembersOf] = useState<number | null>(null);
  const [members, setMembers] = useState<AdminChatMember[]>([]);
  const [memberInput, setMemberInput] = useState('');
  const [userOpts, setUserOpts] = useState<ChatUserOption[]>([]);

  const [newDmOpen, setNewDmOpen] = useState(false);
  const [newDmUser, setNewDmUser] = useState('');
  const [newDmOpts, setNewDmOpts] = useState<ChatUserOption[]>([]);

  const [editGroup, setEditGroup] = useState<AdminChatGroup | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editJoinPolicy, setEditJoinPolicy] = useState<JoinPolicy>(JoinPolicy.Open);
  const [editAdminOnly, setEditAdminOnly] = useState(false);
  const [editUploading, setEditUploading] = useState(false);

  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const activeRef = useRef<ActiveConv | null>(null);
  const messagesRef = useRef<AdminChatMessage[]>([]);
  const typingRef = useRef(0);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPos({
      x: Math.max(8, window.innerWidth - WIDTH - 24),
      y: Math.max(8, window.innerHeight - HEIGHT - 24),
    });
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const claimAudio = useCallback((el: HTMLAudioElement) => {
    const prev = currentAudioRef.current;
    if (prev !== null && prev !== el) prev.pause();
    currentAudioRef.current = el;
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await getChatGroups());
    } catch {
      return;
    }
  }, []);

  const loadDms = useCallback(async (scope: DmScope) => {
    try {
      const page = await getAdminDms(scope);
      if (scope === DmScope.Mine) setDmsMine(page.items);
      else setDmsQueue(page.items);
      setUnreadMap((prev) => {
        const next = { ...prev };
        for (const item of page.items) next[item.id] = item.unread;
        return next;
      });
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
    void loadDms(DmScope.Mine);
    void loadDms(DmScope.Queue);
  }, [open, loadGroups, loadSettings, loadDms]);

  const loadHistory = useCallback(async (id: number) => {
    setMessages([]);
    setHasMore(false);
    setLoadingMsgs(true);
    try {
      const rows = await getChatHistory(id, PAGE_SIZE);
      setMessages(rows);
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    const cur = activeRef.current;
    const rows = messagesRef.current;
    if (cur === null || loadingMore || !hasMore || rows.length === 0) return;
    setLoadingMore(true);
    try {
      const older = await getChatHistory(cur.id, PAGE_SIZE, rows[0].id);
      if (older.length > 0) {
        setMessages((prev) => sortUniqueById([...older, ...prev]));
      }
      setHasMore(older.length === PAGE_SIZE);
    } catch {
      return;
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  const clearBadges = (id: number) => {
    setUnreadMap((prev) => ({ ...prev, [id]: 0 }));
    setMentionMap((prev) => ({ ...prev, [id]: 0 }));
  };

  const openGroupConv = (g: AdminChatGroup) => {
    setActive({
      id: g.id,
      title: g.name,
      avatar: g.avatar,
      isDm: false,
      type: g.type,
      subtitle: g.type === GroupType.Private ? 'Private group' : 'Public group',
    });
    setReply(null);
    setTypingName('');
    clearBadges(g.id);
    void loadHistory(g.id);
  };

  const openDmConv = (dm: AdminDmItem) => {
    const name = dm.peer.name === '' ? 'User' : dm.peer.name;
    setActive({
      id: dm.id,
      title: name,
      avatar: dm.peer.avatar,
      isDm: true,
      type: GroupType.Private,
      subtitle: 'Direct message',
    });
    setReply(null);
    setTypingName('');
    clearBadges(dm.id);
    void loadHistory(dm.id);
  };

  const socketGroupIds = useMemo(() => {
    const ids = new Set<number>();
    for (const g of groups) ids.add(g.id);
    for (const d of dmsMine) ids.add(d.id);
    for (const d of dmsQueue) ids.add(d.id);
    if (active !== null) ids.add(active.id);
    return Array.from(ids);
  }, [groups, dmsMine, dmsQueue, active]);

  useAdminChatSocket({
    active: open,
    token: adminToken,
    groupIds: socketGroupIds,
    onNew: (m) => {
      const cur = activeRef.current;
      const isMine = m.senderRole === SenderRole.Admin && m.userId === adminKey;
      if (cur !== null && m.groupId === cur.id) {
        setMessages((prev) => mergeById(prev, m));
        if (!isMine) setTypingName('');
      } else if (!isMine) {
        setUnreadMap((prev) => {
          const current = prev[m.groupId] === undefined ? 0 : prev[m.groupId];
          return { ...prev, [m.groupId]: current + 1 };
        });
      }
    },
    onDelete: (p) => {
      const cur = activeRef.current;
      if (cur !== null && p.groupId === cur.id) {
        setMessages((prev) => prev.filter((x) => x.id !== p.id));
      }
    },
    onCleared: (groupId) => {
      const cur = activeRef.current;
      if (cur !== null && cur.id === groupId) setMessages([]);
    },
    onTyping: (groupId, userId, isAdmin) => {
      const cur = activeRef.current;
      if (cur === null || cur.id !== groupId || userId === adminKey) return;
      const found = messagesRef.current.find((m) => m.userId === userId);
      const name =
        found !== undefined && found.senderName !== ''
          ? found.senderName
          : isAdmin
            ? 'Admin'
            : 'User';
      setTypingName(name);
      if (typingClearRef.current !== null) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setTypingName(''), 3500);
    },
    onDelivered: (p) => {
      if (p.userId === adminKey) return;
      setReceiptMap((prev) => {
        const cur = prev[p.groupId];
        const delivered = cur === undefined ? 0 : cur.delivered;
        const read = cur === undefined ? 0 : cur.read;
        return {
          ...prev,
          [p.groupId]: { delivered: Math.max(delivered, p.lastDeliveredId), read },
        };
      });
    },
    onRead: (p) => {
      if (p.userId === adminKey) return;
      setReceiptMap((prev) => {
        const cur = prev[p.groupId];
        const delivered = cur === undefined ? 0 : cur.delivered;
        const read = cur === undefined ? 0 : cur.read;
        return {
          ...prev,
          [p.groupId]: {
            delivered: Math.max(delivered, p.lastReadId),
            read: Math.max(read, p.lastReadId),
          },
        };
      });
    },
    onGroupUpdate: (p) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === p.groupId
            ? {
                ...g,
                name: p.name,
                avatar: p.avatar,
                description: p.description,
                type: p.type,
                joinPolicy: p.joinPolicy,
                postPolicy: p.postPolicy,
                visibility: p.visibility,
              }
            : g,
        ),
      );
      const cur = activeRef.current;
      if (cur !== null && cur.id === p.groupId && !cur.isDm) {
        setActive({ ...cur, title: p.name, avatar: p.avatar, type: p.type });
      }
    },
    onDmCreated: () => {
      void loadDms(DmScope.Mine);
      void loadDms(DmScope.Queue);
    },
    onDmClaimed: () => {
      void loadDms(DmScope.Mine);
      void loadDms(DmScope.Queue);
    },
    onMentionBadge: (p) => {
      const cur = activeRef.current;
      if (cur !== null && cur.id === p.groupId) return;
      setMentionMap((prev) => {
        const current = prev[p.groupId] === undefined ? 0 : prev[p.groupId];
        return { ...prev, [p.groupId]: current + 1 };
      });
    },
    onReconnect: () => {
      void loadGroups();
      void loadDms(DmScope.Mine);
      void loadDms(DmScope.Queue);
      const cur = activeRef.current;
      if (cur !== null) void loadHistory(cur.id);
    },
  });

  const participants = useMemo<Participant[]>(() => {
    const map = new Map<string, Participant>();
    for (const m of messages) {
      if (m.senderRole === SenderRole.User && !map.has(m.userId)) {
        map.set(m.userId, {
          userId: m.userId,
          name: m.senderName,
          avatar: m.senderAvatar,
        });
      }
    }
    return Array.from(map.values());
  }, [messages]);

  const totalUnread = useMemo(
    () => Object.values(unreadMap).reduce((a, b) => a + b, 0),
    [unreadMap],
  );
  const totalMentions = useMemo(
    () => Object.values(mentionMap).reduce((a, b) => a + b, 0),
    [mentionMap],
  );

  const emitTyping = () => {
    const cur = activeRef.current;
    if (cur === null) return;
    const now = Date.now();
    if (now - typingRef.current < TYPING_EMIT_MS) return;
    typingRef.current = now;
    emitAdminChatTyping(cur.id);
  };

  const doSendText = async (p: {
    content: string;
    imageUrl?: string;
    mentions?: string[];
  }): Promise<boolean> => {
    const cur = activeRef.current;
    if (cur === null) return false;
    setSending(true);
    try {
      const msg = await sendChatMessage(cur.id, {
        content: p.content,
        imageUrl: p.imageUrl,
        mentions: p.mentions,
        replyToId: reply === null ? undefined : reply.id,
      });
      setReply(null);
      setMessages((prev) => mergeById(prev, msg));
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to send');
      return false;
    } finally {
      setSending(false);
    }
  };

  const doSendVoice = async (res: VoiceResult): Promise<boolean> => {
    const cur = activeRef.current;
    if (cur === null) return false;
    setSending(true);
    try {
      const up = await uploadChatAudio(res.file);
      const msg = await sendChatMessage(cur.id, {
        content: '',
        kind: MessageKind.Voice,
        audioUrl: up.url,
        durationMs: res.durationMs,
        audioWaveform: res.waveform,
        replyToId: reply === null ? undefined : reply.id,
      });
      setReply(null);
      setMessages((prev) => mergeById(prev, msg));
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to send voice');
      return false;
    } finally {
      setSending(false);
    }
  };

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

  const onMsgAction = (action: MsgAction, msg: AdminChatMessage) => {
    if (action === MsgAction.Reply) {
      setReply(msg);
    } else if (action === MsgAction.Copy) {
      void navigator.clipboard.writeText(msg.content).catch(() => undefined);
    } else if (action === MsgAction.Mute) {
      void doMute(msg.userId);
    } else if (action === MsgAction.Delete) {
      void doDelete(msg.id);
    }
  };

  const doClearGroup = async () => {
    const cur = activeRef.current;
    if (cur === null) return;
    try {
      await clearChatGroupMessages(cur.id);
      setMessages([]);
      message.success('Messages cleared');
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
    if (name === '') return;
    try {
      await createChatGroup(
        name,
        newType,
        '',
        newAdminOnly ? PostPolicy.AdminOnly : PostPolicy.All,
      );
      setNewName('');
      setNewAdminOnly(false);
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
    if (uid === '' || membersOf === null) return;
    try {
      await addChatMember(membersOf, uid);
      setMemberInput('');
      setUserOpts([]);
      setMembers(await getChatMembers(membersOf));
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

  const onUserSearch = (q: string, target: 'member' | 'dm') => {
    const query = q.trim();
    if (query === '') {
      if (target === 'member') setUserOpts([]);
      else setNewDmOpts([]);
      return;
    }
    searchChatUsers(query)
      .then((list) => {
        if (target === 'member') setUserOpts(list);
        else setNewDmOpts(list);
      })
      .catch(() => {
        if (target === 'member') setUserOpts([]);
        else setNewDmOpts([]);
      });
  };

  const doOpenDm = async () => {
    const uid = newDmUser.trim();
    if (uid === '') return;
    try {
      const dm = await openAdminDm(uid);
      setNewDmOpen(false);
      setNewDmUser('');
      setNewDmOpts([]);
      await loadDms(DmScope.Mine);
      setListTab(ListTab.Dms);
      openDmConv(dm);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const doClaimDm = async (dm: AdminDmItem) => {
    try {
      await claimAdminDm(dm.id);
      await loadDms(DmScope.Mine);
      await loadDms(DmScope.Queue);
      message.success('Conversation claimed');
      openDmConv(dm);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const startEditGroup = (g: AdminChatGroup) => {
    setEditGroup(g);
    setEditName(g.name);
    setEditAvatar(g.avatar);
    setEditJoinPolicy(
      g.joinPolicy === JoinPolicy.Invite ? JoinPolicy.Invite : JoinPolicy.Open,
    );
    setEditAdminOnly(g.postPolicy === PostPolicy.AdminOnly);
  };

  const onEditAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file === undefined) return;
    setEditUploading(true);
    try {
      const res = await uploadGroupAvatar(file);
      setEditAvatar(res.url);
    } catch (err) {
      message.warning(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setEditUploading(false);
    }
  };

  const saveEditGroup = async () => {
    if (editGroup === null) return;
    const name = editName.trim();
    if (name === '') return;
    try {
      await updateChatGroup(editGroup.id, {
        name,
        avatar: editAvatar,
        joinPolicy: editJoinPolicy,
        postPolicy: editAdminOnly ? PostPolicy.AdminOnly : PostPolicy.All,
      });
      setEditGroup(null);
      await loadGroups();
      message.success('Group updated');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    if (isMobile || panelMode !== PanelMode.Normal) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') !== null) return;
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHeaderPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current === null) return;
    const x = Math.min(Math.max(0, e.clientX - dragRef.current.dx), window.innerWidth - 80);
    const y = Math.min(Math.max(0, e.clientY - dragRef.current.dy), window.innerHeight - 48);
    setPos({ x, y });
  };
  const onHeaderPointerUp = () => {
    dragRef.current = null;
  };

  if (admin === null) return null;

  if (!open || minimized) {
    return (
      <div className="adm-chat-root adm-fab-wrap">
        <Badge count={totalUnread} overflowCount={99} offset={[-3, 3]}>
          <Tooltip title="Community Chat" placement="left">
            <button
              type="button"
              className="adm-fab"
              onClick={() => {
                setOpen(true);
                setMinimized(false);
              }}
              aria-label="Open community chat"
            >
              <WhatsAppGlyph />
            </button>
          </Tooltip>
        </Badge>
        {totalMentions > 0 && <span className="adm-fab-at">@{totalMentions > 99 ? '99+' : totalMentions}</span>}
      </div>
    );
  }

  const modeGeometry: Record<PanelMode, React.CSSProperties> = {
    [PanelMode.Normal]: {
      left: pos.x,
      top: pos.y,
      width: WIDTH,
      height: HEIGHT,
      maxWidth: 'calc(100vw - 16px)',
      maxHeight: 'calc(100dvh - 16px)',
      borderRadius: 22,
    },
    [PanelMode.Max]: {
      left: 8,
      top: 8,
      width: 'calc(100vw - 16px)',
      height: 'calc(100dvh - 16px)',
      borderRadius: 16,
    },
    [PanelMode.Full]: {
      left: 0,
      top: 0,
      width: '100vw',
      height: '100dvh',
      borderRadius: 0,
    },
  };

  const mobileGeometry: React.CSSProperties = {
    left: 0,
    top: 0,
    width: '100vw',
    height: '100dvh',
    maxWidth: '100vw',
    maxHeight: '100dvh',
    borderRadius: 0,
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 900,
    ...(isMobile ? mobileGeometry : modeGeometry[panelMode]),
  };

  const headerTitle = manageOpen
    ? 'Manage Chat'
    : active !== null
      ? active.title
      : 'Community Chat';
  const headerSub =
    active !== null && typingName !== ''
      ? `${typingName} is typing…`
      : active !== null
        ? active.subtitle
        : manageOpen
          ? 'Settings and moderation'
          : `${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`;
  const isTypingSub = active !== null && typingName !== '';

  const showReceipts = active !== null && (active.isDm || active.type === GroupType.Private);
  const activeReceipt =
    active === null || receiptMap[active.id] === undefined ? null : receiptMap[active.id];

  const dmList = listTab === ListTab.Queue ? dmsQueue : dmsMine;

  return (
    <VoiceClaimContext.Provider value={claimAudio}>
      <div className="adm-chat-root adm-panel" style={panelStyle}>
        <div
          className="adm-header"
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          style={{ cursor: !isMobile && panelMode === PanelMode.Normal ? 'move' : 'default' }}
        >
          {manageOpen || active !== null ? (
            <button
              type="button"
              className="adm-icon-btn"
              onClick={() => {
                if (manageOpen) setManageOpen(false);
                else setActive(null);
              }}
            >
              <ArrowLeftOutlined />
            </button>
          ) : (
            <span className="adm-icon-btn adm-accent"><ChatGlyph /></span>
          )}
          {active !== null && !manageOpen && (
            <Avatar src={active.avatar} name={active.title} size={34} />
          )}
          <div className="adm-header-info">
            <span className="adm-header-title">{headerTitle}</span>
            <span className={isTypingSub ? 'adm-header-sub adm-typing' : 'adm-header-sub'}>{headerSub}</span>
          </div>
          {active !== null && !active.isDm && !manageOpen && (
            <>
              <Tooltip title="Edit group">
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() => {
                    const g = groups.find((x) => x.id === active.id);
                    if (g !== undefined) startEditGroup(g);
                  }}
                >
                  <EditOutlined />
                </button>
              </Tooltip>
              <Popconfirm
                title="Clear all messages in this group?"
                onConfirm={() => void doClearGroup()}
                okText="Clear"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Clear all messages">
                  <button type="button" className="adm-icon-btn"><ClearOutlined /></button>
                </Tooltip>
              </Popconfirm>
            </>
          )}
          <Tooltip title="Minimize">
            <button type="button" className="adm-icon-btn" onClick={() => setMinimized(true)}><MinusOutlined /></button>
          </Tooltip>
          {!isMobile && (
            <>
              <Tooltip title={panelMode === PanelMode.Max ? 'Restore' : 'Maximize'}>
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() =>
                    setPanelMode((m) => (m === PanelMode.Max ? PanelMode.Normal : PanelMode.Max))
                  }
                >
                  {panelMode === PanelMode.Max ? <CompressOutlined /> : <ExpandOutlined />}
                </button>
              </Tooltip>
              <Tooltip title={panelMode === PanelMode.Full ? 'Exit full screen' : 'Full screen'}>
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() =>
                    setPanelMode((m) => (m === PanelMode.Full ? PanelMode.Normal : PanelMode.Full))
                  }
                >
                  {panelMode === PanelMode.Full ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                </button>
              </Tooltip>
            </>
          )}
          <Tooltip title="Close">
            <button type="button" className="adm-icon-btn" onClick={() => setOpen(false)}><CloseOutlined /></button>
          </Tooltip>
        </div>

        {manageOpen ? (
          <div className="adm-manage">
            <div className="adm-manage-card">
              <div className="adm-manage-title">Settings</div>
              <div className="adm-manage-row"><span>Enable group chat</span><Switch checked={settings.enabled} onChange={(v) => setSettings((s) => ({ ...s, enabled: v }))} /></div>
              <div className="adm-manage-row"><span>Auto-block links</span><Switch checked={settings.blockLinks} onChange={(v) => setSettings((s) => ({ ...s, blockLinks: v }))} /></div>
              <div className="adm-manage-row"><span>Allow image sharing</span><Switch checked={settings.imageEnabled} onChange={(v) => setSettings((s) => ({ ...s, imageEnabled: v }))} /></div>
              <div className="adm-manage-row"><span>Allow voice messages</span><Switch checked={settings.voiceEnabled} onChange={(v) => setSettings((s) => ({ ...s, voiceEnabled: v }))} /></div>
              <div className="adm-manage-row"><span>Allow direct messages</span><Switch checked={settings.dmEnabled} onChange={(v) => setSettings((s) => ({ ...s, dmEnabled: v }))} /></div>
              <Input.TextArea
                value={settings.badWords}
                onChange={(e) => setSettings((s) => ({ ...s, badWords: e.target.value }))}
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder="Bad words (comma or newline separated)"
                style={{ marginBottom: 10 }}
              />
              <Button type="primary" block onClick={() => void saveSettings()}>Save Settings</Button>
            </div>

            <div className="adm-manage-card">
              <div className="adm-manage-title">Create Group</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name" maxLength={100} />
                <Select
                  value={newType}
                  onChange={setNewType}
                  style={{ width: 110 }}
                  options={[
                    { label: 'Public', value: GroupType.Public },
                    { label: 'Private', value: GroupType.Private },
                  ]}
                />
              </div>
              <div className="adm-manage-row">
                <span>Admin-only posting (announcement)</span>
                <Switch checked={newAdminOnly} onChange={setNewAdminOnly} />
              </div>
              <Button icon={<PlusOutlined />} block onClick={() => void doCreateGroup()}>Create</Button>
            </div>

            <div className="adm-manage-card">
              <div className="adm-manage-title">Groups</div>
              {groups.map((g) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {g.name}
                    {g.type === GroupType.Private && <span className="adm-tag">Private</span>}
                  </span>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEditGroup(g)} />
                  {g.type === GroupType.Private && (
                    <Button type="text" size="small" icon={<TeamOutlined />} onClick={() => void openMembers(g.id)} />
                  )}
                  <Popconfirm title="Delete group?" onConfirm={() => void doDeleteGroup(g.id)} okText="Delete" okButtonProps={{ danger: true }}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              ))}
              {membersOf !== null && (
                <div style={{ marginTop: 8, padding: 10, border: '1px solid var(--adm-hairline)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
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
                      onSearch={(q) => onUserSearch(q, 'member')}
                      onChange={(v: string) => setMemberInput(v)}
                      notFoundContent={null}
                      options={userOpts.map((u) => ({
                        value: u.userId,
                        label: `${u.nickname === '' ? u.userId : u.nickname} (${u.phone === '' ? u.userId : u.phone})`,
                      }))}
                    />
                    <Button size="small" type="primary" disabled={memberInput === ''} onClick={() => void doAddMember()}>Add</Button>
                  </div>
                  {members.length === 0 ? (
                    <div style={{ color: 'var(--adm-muted)', fontSize: 12 }}>No members</div>
                  ) : (
                    members.map((mem) => (
                      <div key={mem.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mem.nickname === '' ? mem.userId : mem.nickname}
                        </span>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => void doRemoveMember(mem.userId)} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="adm-manage-card">
              <div className="adm-manage-title">Muted Users</div>
              {muted.length === 0 ? (
                <div style={{ color: 'var(--adm-muted)', fontSize: 12 }}>None</div>
              ) : (
                muted.map((m) => (
                  <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12 }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {m.userId}
                      <span style={{ color: 'var(--adm-muted)', marginLeft: 6 }}>
                        {m.mutedUntil === null ? 'permanent' : `until ${new Date(m.mutedUntil).toLocaleString()}`}
                      </span>
                    </span>
                    <Button size="small" onClick={() => void doUnmute(m.userId)}>Unmute</Button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : active !== null ? (
          <div className="adm-convo">
            <MessageList
              messages={messages}
              adminKey={adminKey}
              loading={loadingMsgs && messages.length === 0}
              loadingMore={loadingMore}
              showReceipts={showReceipts}
              receipt={activeReceipt}
              onReachTop={() => void loadMore()}
              onAction={onMsgAction}
              onImage={(url) => setLightbox(url)}
            />
            {reply !== null && (
              <div className="adm-reply-bar">
                <div className="adm-reply-info">
                  <span className="adm-reply-name">{reply.senderName === '' ? 'Player' : reply.senderName}</span>
                  <span className="adm-reply-text">
                    {reply.kind === MessageKind.Voice
                      ? 'Voice message'
                      : reply.imageUrl !== null && reply.content === ''
                        ? 'Photo'
                        : reply.content}
                  </span>
                </div>
                <button type="button" className="adm-icon-btn" onClick={() => setReply(null)}><XGlyph /></button>
              </div>
            )}
            <Composer
              sending={sending}
              imageEnabled={settings.imageEnabled}
              voiceEnabled={settings.voiceEnabled}
              participants={participants}
              onSendText={doSendText}
              onSendVoice={doSendVoice}
              onTyping={emitTyping}
            />
          </div>
        ) : (
          <>
            <div className="adm-toolbar">
              <Segmented
                className="adm-toolbar-seg"
                size="small"
                value={listTab}
                onChange={(v) => {
                  const nv = v as ListTab;
                  setListTab(nv);
                  if (nv === ListTab.Dms) void loadDms(DmScope.Mine);
                  if (nv === ListTab.Queue) void loadDms(DmScope.Queue);
                }}
                options={[
                  { label: 'Groups', value: ListTab.Groups },
                  ...(settings.dmEnabled
                    ? [
                        { label: 'DMs', value: ListTab.Dms },
                        { label: 'Queue', value: ListTab.Queue },
                      ]
                    : []),
                ]}
              />
              {settings.dmEnabled && (
                <Tooltip title="New direct message">
                  <button type="button" className="adm-icon-btn" onClick={() => setNewDmOpen(true)}><UserAddOutlined /></button>
                </Tooltip>
              )}
              <Tooltip title="Manage">
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() => {
                    setManageOpen(true);
                    void loadSettings();
                    void loadMuted();
                  }}
                >
                  <SettingOutlined />
                </button>
              </Tooltip>
            </div>
            <div className="adm-list">
              {listTab === ListTab.Groups ? (
                groups.length === 0 ? (
                  <div className="adm-empty"><div className="adm-empty-ic"><ChatGlyph /></div><span className="adm-empty-title">No groups yet</span></div>
                ) : (
                  groups.map((g) => (
                    <GroupRow
                      key={g.id}
                      group={g}
                      unread={unreadMap[g.id] === undefined ? 0 : unreadMap[g.id]}
                      mentions={mentionMap[g.id] === undefined ? 0 : mentionMap[g.id]}
                      onOpen={() => openGroupConv(g)}
                      onEdit={() => startEditGroup(g)}
                    />
                  ))
                )
              ) : dmList.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty-ic"><ChatGlyph /></div>
                  <span className="adm-empty-title">{listTab === ListTab.Queue ? 'Queue is empty' : 'No direct messages'}</span>
                </div>
              ) : (
                dmList.map((dm) => (
                  <DmRow
                    key={dm.id}
                    dm={dm}
                    unread={unreadMap[dm.id] === undefined ? 0 : unreadMap[dm.id]}
                    showClaim={listTab === ListTab.Queue}
                    onOpen={() => openDmConv(dm)}
                    onClaim={() => void doClaimDm(dm)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {lightbox !== '' && (
        <div className="adm-lightbox" onClick={() => setLightbox('')}>
          <img src={lightbox} alt="" />
        </div>
      )}

      <Modal
        open={newDmOpen}
        title="New Direct Message"
        onCancel={() => setNewDmOpen(false)}
        onOk={() => void doOpenDm()}
        okText="Open"
        okButtonProps={{ disabled: newDmUser === '' }}
        destroyOnClose
      >
        <Select
          showSearch
          style={{ width: '100%' }}
          value={newDmUser === '' ? undefined : newDmUser}
          placeholder="Search a user"
          filterOption={false}
          onSearch={(q) => onUserSearch(q, 'dm')}
          onChange={(v: string) => setNewDmUser(v)}
          notFoundContent={null}
          options={newDmOpts.map((u) => ({
            value: u.userId,
            label: `${u.nickname === '' ? u.userId : u.nickname} (${u.phone === '' ? u.userId : u.phone})`,
          }))}
        />
      </Modal>

      <Modal
        open={editGroup !== null}
        title="Edit Group"
        onCancel={() => setEditGroup(null)}
        onOk={() => void saveEditGroup()}
        okText="Save"
        okButtonProps={{ disabled: editName.trim() === '' }}
        destroyOnClose
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <Avatar src={editAvatar} name={editName} size={56} />
          <div>
            <input ref={editFileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onEditAvatarFile} />
            <Button size="small" loading={editUploading} onClick={() => editFileRef.current?.click()}>
              {editAvatar === '' ? 'Upload image' : 'Replace image'}
            </Button>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--adm-muted)', marginBottom: 4 }}>Name</div>
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} placeholder="Group name" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--adm-muted)', marginBottom: 4 }}>Join policy</div>
          <Select
            style={{ width: '100%' }}
            value={editJoinPolicy}
            onChange={(v: JoinPolicy) => setEditJoinPolicy(v)}
            options={[
              { label: 'Open (anyone can join)', value: JoinPolicy.Open },
              { label: 'Invite only', value: JoinPolicy.Invite },
            ]}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 13 }}>Admin-only posting (announcement)</div>
            <div style={{ fontSize: 12, color: 'var(--adm-muted)' }}>
              Members can read but only admins can post
            </div>
          </div>
          <Switch checked={editAdminOnly} onChange={setEditAdminOnly} />
        </div>
      </Modal>
    </VoiceClaimContext.Provider>
  );
};

export default AdminChatWidget;
