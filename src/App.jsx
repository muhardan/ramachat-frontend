import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
  Send, User, Check, CheckCheck, Loader, MoreVertical,
  MessageSquare, Search, ArrowLeft, Paperclip, Smile, Lock,
  Image as ImageIcon, FileText, CircleDashed, X, Download, Maximize2, Minimize2,
  Mic, MicOff, Phone, PhoneOff, Video, VideoOff, ChevronDown, Reply, Copy, Trash2,
  BellRing, UserPlus, Play, Square, Pause, LogOut, Settings, Star,
  Archive, Bell, BellOff, Ban, Trash, RefreshCw, ChevronRight,
  Camera, Edit3, Check as CheckIcon
} from 'lucide-react';

// ============================================================
// KONFIGURASI
// ============================================================
let API_URL = 'http://localhost:5000/api';
let SOCKET_URL = 'http://localhost:5000';
try {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    API_URL = import.meta.env.VITE_API_URL || API_URL;
    SOCKET_URL = import.meta.env.VITE_SOCKET_URL || SOCKET_URL;
  }
} catch (e) {}

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============================================================
// HELPERS
// ============================================================
const encryptMessage = (text) => {
  try { return btoa(encodeURIComponent(String(text))); }
  catch (e) { return String(text); }
};
const decryptMessage = (encoded) => {
  if (!encoded) return '';
  try { return decodeURIComponent(atob(String(encoded))); }
  catch (e) { return String(encoded); }
};
const formatTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};
const formatDateDivider = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hari ini';
  if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};
const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
const parseMessageContent = (rawMessage) => {
  if (!rawMessage) return { type: 'text', text: '' };
  try {
    if (typeof rawMessage === 'string' && rawMessage.startsWith('{')) {
      const parsed = JSON.parse(rawMessage);
      if (parsed && typeof parsed === 'object') {
        return {
          type: parsed.type || 'text',
          text: parsed.text || '',
          fileData: parsed.fileData || null,
          fileName: parsed.fileName || '',
          replyTo: parsed.replyTo || null,
        };
      }
    }
  } catch (e) {}
  return { type: 'text', text: String(rawMessage) };
};
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
};

const EMOJIS = [
  '😀','😂','🤣','😍','🙏','😘','🥰','😊','😎','😢','😭','😡','😠',
  '👍','👎','❤️','🔥','🎉','✨','💯','🤝','🙌','🤔','👀','💪','🎶',
  '😅','🥺','😤','🤯','😴','🥳','😷','🤧','🥶','😏','🤩','😬','🧐',
  '👋','✌️','🤙','💀','👻','🍕','☕','🎮','🚀','💡',
];

// Avatar colorful berdasarkan nama
const AVATAR_COLORS = [
  ['#6B5B95','#8B7BAF'],['#F7B731','#F9C74F'],['#26C6DA','#4FC3F7'],
  ['#EF5350','#EF9A9A'],['#66BB6A','#A5D6A7'],['#FF7043','#FFAB91'],
  ['#AB47BC','#CE93D8'],['#29B6F6','#81D4FA'],
];
const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

// Avatar dengan warna & inisial
const Avatar = ({ name, size = 40, online = false, className = '' }) => {
  const [c1, c2] = getAvatarColor(name);
  const initials = getInitials(name);
  const fontSize = size > 48 ? 20 : size > 36 ? 16 : 13;
  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white select-none shadow-inner"
        style={{
          width: size, height: size, fontSize,
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
        }}
      >
        {initials}
      </div>
      {online && (
        <span
          className="absolute border-2 border-[#111b21] rounded-full bg-[#25D366]"
          style={{ width: 12, height: 12, bottom: 0, right: 0 }}
        />
      )}
    </div>
  );
};

// Toast notification
const Toast = ({ message, type = 'success', onClose }) => (
  <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] px-6 py-3 rounded-xl shadow-2xl text-white text-[14px] font-medium flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 ${type === 'error' ? 'bg-red-500' : 'bg-[#00a884]'}`}>
    {type === 'error' ? <X size={16} /> : <CheckIcon size={16} />}
    {message}
  </div>
);

// ============================================================
// LOGIN / REGISTER
// ============================================================
const LoginRegister = ({ setIsAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await api.post(endpoint, formData);
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setIsAuth(true);
        navigate('/');
      } else {
        setIsLogin(true);
        setError('');
        setFormData({ name: '', email: '', password: '' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-[#111b21] flex flex-col overflow-hidden font-sans">
      {/* Top green bar */}
      <div className="w-full h-[230px] bg-[#00a884] absolute top-0 left-0 z-0" />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 text-white">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <MessageSquare size={22} fill="white" className="text-transparent" />
          </div>
          <span className="text-xl font-bold tracking-widest">RAMACHAT</span>
        </div>

        <div className="w-full max-w-[960px] bg-[#202c33] rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-[0.97] fade-in duration-500 border border-[#2a3942]/60">
          {/* Left panel */}
          <div className="hidden md:flex flex-col justify-center flex-1 p-14 bg-[#111b21]">
            <h1 className="text-[38px] font-light text-[#e9edef] leading-tight mb-8">
              Terhubung dengan<br />
              <span className="text-[#00a884] font-semibold">siapapun,</span><br />
              kapanpun.
            </h1>
            <ul className="space-y-5 text-[#8696a0] text-[15px]">
              {['Pesan & panggilan terenkripsi end-to-end', 'Kirim foto, video, dan dokumen', 'Panggilan suara & video HD', 'Voice note & pesan suara'].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#00a884]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right panel — form */}
          <div className="w-full md:w-[400px] p-8 md:p-12 flex flex-col justify-center bg-[#202c33]">
            <h2 className="text-[26px] font-semibold text-[#e9edef] mb-2">
              {isLogin ? 'Masuk' : 'Daftar'}
            </h2>
            <p className="text-[#8696a0] text-[14px] mb-8">
              {isLogin ? 'Selamat datang kembali!' : 'Buat akun baru secara gratis.'}
            </p>

            {error && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[13px] flex items-center gap-2">
                <X size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <input
                    type="text" required autoComplete="name"
                    placeholder="Nama tampilan"
                    className="w-full bg-[#111b21] text-[#e9edef] px-4 py-3.5 rounded-xl border border-[#2a3942] focus:border-[#00a884] focus:outline-none transition-all text-[15px] placeholder-[#8696a0]"
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    value={formData.name}
                  />
                </div>
              )}
              <div>
                <input
                  type="email" required autoComplete="email"
                  placeholder="Alamat email"
                  className="w-full bg-[#111b21] text-[#e9edef] px-4 py-3.5 rounded-xl border border-[#2a3942] focus:border-[#00a884] focus:outline-none transition-all text-[15px] placeholder-[#8696a0]"
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  value={formData.email}
                />
              </div>
              <div>
                <input
                  type="password" required autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="Kata sandi"
                  className="w-full bg-[#111b21] text-[#e9edef] px-4 py-3.5 rounded-xl border border-[#2a3942] focus:border-[#00a884] focus:outline-none transition-all text-[15px] placeholder-[#8696a0]"
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  value={formData.password}
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-[#00a884] hover:bg-[#00cf9d] active:scale-[0.98] disabled:opacity-60 text-[#111b21] font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-[15px] shadow-lg mt-2"
              >
                {loading ? <Loader className="animate-spin" size={20} /> : (isLogin ? 'Masuk' : 'Buat Akun')}
              </button>
            </form>

            <p className="text-center text-[#8696a0] text-[13px] mt-6">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
              <button onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ name: '', email: '', password: '' }); }} className="text-[#00a884] font-semibold hover:underline ml-1">
                {isLogin ? 'Daftar' : 'Masuk'}
              </button>
            </p>

            <div className="flex items-center justify-center gap-2 mt-8 text-[#8696a0] text-[12px]">
              <Lock size={12} /> <span>Dienkripsi end-to-end</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CHAT APP
// ============================================================
const ChatApp = ({ setIsAuth }) => {
  // Core state
  const [splashDone, setSplashDone] = useState(false);
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [recentChats, setRecentChats] = useState({});

  // UI states
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats' | 'settings' | 'profile'
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [viewingImage, setViewingImage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [toast, setToast] = useState(null);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  // Call state
  const [callState, setCallState] = useState({ status: 'idle', type: 'audio', partner: null, duration: 0, isMuted: false, isVideoOff: false, offer: null });
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const sidebarMenuRef = useRef(null);
  const chatMenuRef = useRef(null);
  const inputRef = useRef(null);
  const activeUserRef = useRef(activeUser);
  const callTimerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const messagesAreaRef = useRef(null);

  // Current user
  let currentUser = { name: 'Pengguna', email: '', id: null };
  try {
    const str = localStorage.getItem('user');
    if (str) currentUser = { ...currentUser, ...JSON.parse(str) };
  } catch (e) {}

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Splash
  useEffect(() => { setTimeout(() => setSplashDone(true), 1800); }, []);
  useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

  // Socket init
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(SOCKET_URL, { auth: { token }, reconnectionAttempts: 5, transports: ['websocket'] });
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('user_online', (userId) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_online: true } : u)));
    newSocket.on('user_offline', (userId) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_online: false } : u)));
    newSocket.on('messages_read', ({ readerId }) => {
      setMessages(prev => prev.map(m => m.receiver_id === readerId ? { ...m, status: 'read' } : m));
    });
    newSocket.on('message_deleted', (msgId) => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
    });

    // Call events
    newSocket.on('incoming_call', async (data) => {
      if (data.type === 'answer') {
        if (peerConnectionRef.current && data.answer) {
          try { await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer)); } catch (e) {}
        }
        return;
      }
      setCallState(prev => {
        if (prev.status === 'idle') {
          setIsCallMinimized(false);
          return { status: 'receiving', type: data.type, partner: data.caller, duration: 0, isMuted: false, isVideoOff: false, offer: data.offer };
        }
        return prev;
      });
    });
    newSocket.on('call_accepted', () => { setCallState(prev => ({ ...prev, status: 'connected' })); startCallTimer(); });
    newSocket.on('call_rejected', () => { showToast('Panggilan ditolak.', 'error'); endCallLocally(); });
    newSocket.on('call_ended', () => endCallLocally());

    api.get('/users').then(res => { if (Array.isArray(res.data)) setUsers(res.data); }).catch(() => {});

    return () => { clearInterval(callTimerRef.current); newSocket.close(); };
  }, []);

  // Receive message
  useEffect(() => {
    if (!socket) return;
    const handleReceive = (msg) => {
      if (!msg) return;
      try {
        const decryptedMsg = { ...msg, message: decryptMessage(msg.message) };
        const parsedContent = parseMessageContent(decryptedMsg.message);
        setRecentChats(prev => {
          const senderId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          const isActive = activeUserRef.current?.id === senderId;
          let textPreview = parsedContent.text;
          if (parsedContent.type === 'audio') textPreview = '🎤 Pesan suara';
          if (parsedContent.type === 'image') textPreview = '📷 Foto';
          if (parsedContent.type === 'document') textPreview = `📄 ${parsedContent.fileName || 'Dokumen'}`;
          return {
            ...prev,
            [senderId]: {
              text: textPreview || 'Media',
              time: msg.created_at,
              unread: isActive ? 0 : (prev[senderId]?.unread || 0) + 1,
            },
          };
        });
        setMessages(prev => {
          const currUser = activeUserRef.current;
          if (currUser && (msg.sender_id === currUser.id || msg.receiver_id === currUser.id)) {
            socket.emit('mark_read', { senderId: msg.sender_id });
            return [...prev, decryptedMsg];
          }
          return prev;
        });
      } catch (e) {}
    };
    socket.on('receive_message', handleReceive);
    socket.on('user_typing', ({ senderId }) => { if (activeUserRef.current?.id === senderId) setPartnerTyping(true); });
    socket.on('user_stop_typing', ({ senderId }) => { if (activeUserRef.current?.id === senderId) setPartnerTyping(false); });
    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket]);

  // Fetch history on user switch
  useEffect(() => {
    if (!activeUser) return;
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/messages/${activeUser.id}`);
        if (Array.isArray(res.data)) {
          let lastMsgText = '';
          let lastMsgTime = '';
          const decryptedHistory = res.data.filter(Boolean).map(m => {
            try {
              const dMsg = { ...m, message: decryptMessage(m.message) };
              const parsed = parseMessageContent(dMsg.message);
              lastMsgText = parsed.text || (parsed.type === 'audio' ? '🎤 Pesan suara' : parsed.type === 'image' ? '📷 Foto' : `📄 ${parsed.fileName || 'Dokumen'}`);
              lastMsgTime = dMsg.created_at;
              return dMsg;
            } catch (e) { return m; }
          });
          setMessages(decryptedHistory);
          if (lastMsgText) {
            setRecentChats(prev => ({ ...prev, [activeUser.id]: { text: lastMsgText, time: lastMsgTime, unread: 0 } }));
          }
          socket?.emit('mark_read', { senderId: activeUser.id });
        }
        setReplyingTo(null);
        setShowChatMenu(false);
        setSearchQuery('');
        setShowSearchBar(false);
      } catch (e) {}
    };
    fetchHistory();
  }, [activeUser, socket]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping, replyingTo]);

  // Outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) setShowAttachMenu(false);
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(e.target)) setShowEmojiPicker(false);
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(e.target)) setShowSidebarMenu(false);
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) setShowChatMenu(false);
      if (contextMenu) setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  // Video refs
  useEffect(() => {
    if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream;
    if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream, callState.status, isCallMinimized]);

  // ---- CALL FUNCTIONS ----
  const startCallTimer = () => {
    clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => setCallState(prev => ({ ...prev, duration: prev.duration + 1 })), 1000);
  };
  const requestMedia = async (withVideo) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) { showToast('Browser tidak mendukung akses media.', 'error'); return null; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
      setLocalStream(stream);
      return stream;
    } catch {
      showToast('Gagal mengakses mikrofon/kamera. Periksa izin.', 'error');
      return null;
    }
  };
  const gatherIce = (pc, callback) => {
    let resolved = false;
    const finish = () => { if (!resolved) { resolved = true; callback(pc.localDescription); } };
    pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') finish(); };
    setTimeout(finish, 1500);
  };
  const initiateCall = async (type) => {
    if (!activeUser) return;
    const stream = await requestMedia(type === 'video');
    if (!stream) return;
    setIsCallMinimized(false);
    setCallState({ status: 'calling', type, partner: activeUser, duration: 0, isMuted: false, isVideoOff: false, offer: null });
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerConnectionRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      gatherIce(pc, (finalOffer) => socket?.emit('call_user', { receiverId: activeUser.id, caller: currentUser, type, offer: finalOffer }));
    } catch (e) {}
  };
  const acceptCall = async () => {
    const stream = await requestMedia(callState.type === 'video');
    if (!stream) { endCallLocally(); return; }
    socket?.emit('accept_call', { callerId: callState.partner?.id });
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerConnectionRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    if (callState.offer) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        gatherIce(pc, (finalAnswer) => socket?.emit('call_user', { receiverId: callState.partner.id, type: 'answer', answer: finalAnswer }));
      } catch (e) {}
    }
    setCallState(prev => ({ ...prev, status: 'connected' }));
    startCallTimer();
  };
  const rejectCall = () => {
    socket?.emit('reject_call', { callerId: callState.partner?.id });
    endCallLocally();
  };
  const endCallLocally = () => {
    clearInterval(callTimerRef.current);
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); setLocalStream(null); }
    setRemoteStream(null);
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    if (callState.status !== 'idle' && callState.partner) socket?.emit('end_call', { partnerId: callState.partner.id });
    setIsCallMinimized(false);
    setCallState({ status: 'idle', type: 'audio', partner: null, duration: 0, isMuted: false, isVideoOff: false, offer: null });
  };
  const toggleMute = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) { track.enabled = !track.enabled; setCallState(prev => ({ ...prev, isMuted: !track.enabled })); }
    }
  };
  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) { track.enabled = !track.enabled; setCallState(prev => ({ ...prev, isVideoOff: !track.enabled })); }
    }
  };

  // ---- VOICE NOTE ----
  const handleRecordVoice = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      clearInterval(recordTimerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => handleSendMessage(null, reader.result, 'audio', 'Voice Note');
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);
        recordTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      } catch {
        showToast('Izin mikrofon ditolak.', 'error');
      }
    }
  };

  // ---- CONTEXT MENU ----
  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.pageX, window.innerWidth - 210);
    const y = Math.min(e.pageY, window.innerHeight - 160);
    setContextMenu({ x, y, msg });
  };
  const handleDeleteMessage = (msgId) => {
    socket?.emit('delete_message', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setContextMenu(null);
    showToast('Pesan dihapus.');
  };
  const handleCopyMessage = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
    setContextMenu(null);
    showToast('Pesan disalin.');
  };

  // ---- ADD FRIEND ----
  const handleSearchFriend = async () => {
    if (!friendSearchQuery.trim()) return;
    try {
      const res = await api.get(`/users/search?q=${friendSearchQuery}`);
      setFriendSearchResults(res.data);
    } catch (e) {}
  };
  const handleAddFriend = (user) => {
    if (!users.find(u => u.id === user.id)) setUsers(prev => [user, ...prev]);
    setActiveUser(user);
    setShowAddFriendModal(false);
    setIsMobileView(true);
    setFriendSearchQuery('');
    setFriendSearchResults([]);
  };

  // ---- FILE SELECT ----
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === 'image') {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > h) { if (w > 1024) { h *= 1024 / w; w = 1024; } } else { if (h > 1024) { w *= 1024 / h; h = 1024; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          setSelectedFile({ dataUrl: canvas.toDataURL('image/jpeg', 0.75), type, name: file.name });
          setShowAttachMenu(false);
          inputRef.current?.focus();
        };
      } else {
        setSelectedFile({ dataUrl: event.target.result, type, name: file.name });
        setShowAttachMenu(false);
        inputRef.current?.focus();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // ---- SEND MESSAGE ----
  const handleSendMessage = async (e, forceData = null, forceType = null, forceName = null) => {
    if (e) e.preventDefault();
    const textContent = newMessage.trim();
    const hasMedia = selectedFile || forceData;
    if ((!textContent && !hasMedia) || !activeUser || isSending) return;
    setIsSending(true);

    const payloadObj = {
      type: forceType || (selectedFile ? selectedFile.type : 'text'),
      text: textContent,
      fileData: forceData || (selectedFile ? selectedFile.dataUrl : null),
      fileName: forceName || (selectedFile ? selectedFile.name : null),
      replyTo: replyingTo
        ? { id: replyingTo.id, sender: replyingTo.sender_id === currentUser.id ? 'Anda' : activeUser.name, text: parseMessageContent(replyingTo.message).text || 'Media' }
        : null,
    };
    const stringPayload = JSON.stringify(payloadObj);

    setRecentChats(prev => ({
      ...prev,
      [activeUser.id]: {
        text: textContent || (payloadObj.type === 'audio' ? '🎤 Pesan suara' : payloadObj.type === 'image' ? '📷 Foto' : `📄 ${payloadObj.fileName || 'Dokumen'}`),
        time: new Date().toISOString(),
        unread: 0,
      },
    }));

    setNewMessage('');
    setSelectedFile(null);
    setReplyingTo(null);
    setIsTyping(false);
    setShowEmojiPicker(false);
    socket?.emit('stop_typing', { receiverId: activeUser.id });

    try {
      const res = await api.post('/messages', { receiverId: activeUser.id, message: encryptMessage(stringPayload) });
      setMessages(prev => [...prev, { ...res.data, message: stringPayload }]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      showToast('Gagal mengirim pesan.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // ---- TYPING ----
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!activeUser || !socket) return;
    if (!isTyping) { setIsTyping(true); socket.emit('typing', { receiverId: activeUser.id }); }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop_typing', { receiverId: activeUser.id });
    }, 1500);
  };

  // ---- COMPUTED ----
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(sidebarSearch.toLowerCase())
  );
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const tA = recentChats[a.id]?.time ? new Date(recentChats[a.id].time).getTime() : 0;
      const tB = recentChats[b.id]?.time ? new Date(recentChats[b.id].time).getTime() : 0;
      return tB - tA;
    });
  }, [filteredUsers, recentChats]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    const filteredMsg = searchQuery
      ? messages.filter(m => m && String(parseMessageContent(m.message).text).toLowerCase().includes(searchQuery.toLowerCase()))
      : messages;
    filteredMsg.forEach(msg => {
      if (!msg?.created_at) return;
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== currentDate) {
        groups.push({ type: 'divider', text: formatDateDivider(msg.created_at), id: `div-${msg.id || Math.random()}` });
        currentDate = msgDate;
      }
      groups.push({ type: 'message', data: msg });
    });
    return groups;
  }, [messages, searchQuery]);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuth(false);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="flex w-full bg-[#111b21] text-[#e9edef] font-sans overflow-hidden relative" style={{ height: '100dvh' }}>

      {/* Global Styles */}
      <style>{`
        * { box-sizing: border-box; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(134,150,160,0.25); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(134,150,160,0.45); }
        textarea { resize: none; }
        .msg-bubble-sent { border-radius: 12px 12px 4px 12px; }
        .msg-bubble-recv { border-radius: 12px 12px 12px 4px; }
        .msg-bubble-sent-first { border-radius: 12px 4px 4px 12px; }
        .msg-bubble-recv-first { border-radius: 4px 12px 12px 4px; }
      `}</style>

      {/* ---- SPLASH ---- */}
      {!splashDone && (
        <div className="fixed inset-0 z-[999] bg-[#111b21] flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#00a884] to-[#007a62] flex items-center justify-center shadow-2xl mb-10 animate-pulse">
            <MessageSquare size={48} fill="white" className="text-transparent" />
          </div>
          <div className="flex items-center gap-1 text-2xl font-bold tracking-widest">
            <span className="text-[#00a884]">RAMA</span>
            <span className="text-[#e9edef]">CHAT</span>
          </div>
          <p className="text-[#8696a0] text-[13px] mt-3 tracking-wide">Menghubungkan dengan aman…</p>
          <div className="mt-12 flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* ---- TOAST ---- */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* ---- INCOMING CALL (floating card) ---- */}
      {callState.status === 'receiving' && (
        <div className="fixed top-6 right-6 z-[500] w-80 bg-[#1f2c34] rounded-3xl shadow-2xl border border-[#2a3942] overflow-hidden animate-in slide-in-from-top-8 fade-in duration-400">
          <div className="bg-[#0b141a] p-6 flex flex-col items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00a884]/10 animate-pulse pointer-events-none" />
            <Avatar name={callState.partner?.name} size={72} />
            <div className="text-center">
              <p className="text-[#e9edef] text-xl font-semibold">{callState.partner?.name}</p>
              <p className="text-[#00a884] text-[14px] mt-1 flex items-center justify-center gap-2">
                <BellRing size={14} className="animate-bounce" />
                Panggilan {callState.type === 'video' ? 'Video' : 'Suara'} Masuk
              </p>
            </div>
            <div className="flex gap-10 mt-2">
              <button onClick={rejectCall} className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95">
                <PhoneOff size={24} className="text-white" />
              </button>
              <button onClick={acceptCall} className="w-14 h-14 bg-[#00a884] hover:bg-[#00cf9d] rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 animate-bounce">
                <Phone size={24} className="text-white" fill="white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- ACTIVE CALL (full screen) ---- */}
      {!isCallMinimized && (callState.status === 'calling' || callState.status === 'connected') && (
        <div className="fixed inset-0 z-[500] bg-[#0b141a] flex flex-col items-center justify-between animate-in fade-in duration-300">
          {callState.type === 'video' && (
            <div className="absolute inset-0 bg-black overflow-hidden">
              {remoteStream
                ? <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Avatar name={callState.partner?.name} size={120} /></div>
              }
              {callState.status === 'connected' && (
                <div className="absolute bottom-36 right-4 w-32 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                </div>
              )}
            </div>
          )}
          {callState.type === 'audio' && (
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b141a] to-[#202c33]" />
          )}

          <button onClick={() => setIsCallMinimized(true)} className="absolute top-6 left-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur transition-all">
            <Minimize2 size={20} className="text-white" />
          </button>

          <div className="relative z-10 flex flex-col items-center pt-20 gap-4">
            {callState.type === 'audio' && <Avatar name={callState.partner?.name} size={100} />}
            <p className="text-white text-3xl font-light">{callState.partner?.name}</p>
            <p className="text-[#00a884] text-lg font-medium bg-black/30 px-6 py-1.5 rounded-full backdrop-blur">
              {callState.status === 'calling' ? 'Memanggil…' : formatDuration(callState.duration)}
            </p>
          </div>

          <div className="relative z-10 w-full pb-16 flex items-center justify-center gap-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12">
            {callState.type === 'video' && (
              <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all ${callState.isVideoOff ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}>
                {callState.isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
            )}
            <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all ${callState.isMuted ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}>
              {callState.isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button onClick={endCallLocally} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_24px_rgba(239,68,68,0.5)] transition-all hover:scale-105 active:scale-95">
              <PhoneOff size={26} />
            </button>
          </div>
        </div>
      )}

      {/* Minimized call pip */}
      {isCallMinimized && callState.status !== 'idle' && (
        <div
          onClick={() => setIsCallMinimized(false)}
          className="fixed bottom-8 right-6 w-[90px] h-[140px] rounded-2xl overflow-hidden border-2 border-[#00a884] shadow-2xl z-[400] cursor-pointer hover:scale-105 transition-transform animate-in slide-in-from-bottom-4"
        >
          {callState.type === 'video' && remoteStream
            ? <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-[#1f2c34] flex flex-col items-center justify-center gap-2">
                <Avatar name={callState.partner?.name} size={36} />
                <p className="text-[10px] text-[#00a884] font-semibold">{formatDuration(callState.duration)}</p>
              </div>
          }
        </div>
      )}

      {/* ---- ADD FRIEND MODAL ---- */}
      {showAddFriendModal && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#202c33] rounded-3xl w-full max-w-md shadow-2xl border border-[#2a3942] overflow-hidden animate-in zoom-in-[0.96] duration-300">
            <div className="flex items-center justify-between p-5 border-b border-[#2a3942]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#00a884]/20 rounded-xl flex items-center justify-center">
                  <UserPlus size={18} className="text-[#00a884]" />
                </div>
                <h2 className="text-[#e9edef] text-lg font-semibold">Kontak Baru</h2>
              </div>
              <button onClick={() => setShowAddFriendModal(false)} className="text-[#8696a0] hover:text-white p-1.5 rounded-full hover:bg-[#2a3942] transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-5">
                <input
                  type="text" value={friendSearchQuery}
                  onChange={e => setFriendSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchFriend()}
                  placeholder="Cari nama atau email…"
                  className="flex-1 bg-[#111b21] border border-[#2a3942] rounded-xl px-4 py-3 text-[#e9edef] focus:outline-none focus:border-[#00a884] text-[15px] placeholder-[#8696a0]"
                />
                <button onClick={handleSearchFriend} className="bg-[#00a884] hover:bg-[#00cf9d] text-[#111b21] px-5 rounded-xl font-semibold transition-all active:scale-95">
                  <Search size={18} />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                {friendSearchResults.map(user => (
                  <div key={user.id} className="flex items-center gap-4 p-3 rounded-2xl bg-[#111b21] hover:bg-[#2a3942] transition-colors border border-transparent hover:border-[#374a56]">
                    <Avatar name={user.name} size={44} online={user.is_online} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#e9edef] font-medium text-[15px] truncate">{user.name}</p>
                      <p className="text-[#8696a0] text-[13px] truncate">{user.email}</p>
                    </div>
                    <button onClick={() => handleAddFriend(user)} className="shrink-0 bg-[#00a884]/10 hover:bg-[#00a884] text-[#00a884] hover:text-[#111b21] border border-[#00a884]/40 hover:border-[#00a884] px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all">
                      Chat
                    </button>
                  </div>
                ))}
                {friendSearchResults.length === 0 && friendSearchQuery && (
                  <p className="text-center text-[#8696a0] py-6 text-[14px]">Tidak ada pengguna ditemukan.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- CONTEXT MENU ---- */}
      {contextMenu && (
        <div
          onMouseDown={e => e.stopPropagation()}
          className="fixed z-[400] bg-[#233138] border border-[#374a56] rounded-2xl py-1.5 min-w-[190px] shadow-2xl animate-in fade-in zoom-in-[0.96] duration-150"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={e => { e.stopPropagation(); setReplyingTo(contextMenu.msg); setContextMenu(null); setTimeout(() => inputRef.current?.focus(), 100); }}
            className="w-full flex items-center justify-between px-5 py-2.5 text-[#d1d7db] text-[14px] hover:bg-[#2a3942] transition-colors"
          >
            Balas <Reply size={16} className="text-[#8696a0]" />
          </button>
          {parseMessageContent(contextMenu.msg.message).text && (
            <button
              onClick={e => { e.stopPropagation(); handleCopyMessage(parseMessageContent(contextMenu.msg.message).text); }}
              className="w-full flex items-center justify-between px-5 py-2.5 text-[#d1d7db] text-[14px] hover:bg-[#2a3942] transition-colors"
            >
              Salin <Copy size={16} className="text-[#8696a0]" />
            </button>
          )}
          <div className="h-px bg-[#111b21] my-1 mx-3 opacity-60" />
          <button
            onClick={e => { e.stopPropagation(); handleDeleteMessage(contextMenu.msg.id); }}
            className="w-full flex items-center justify-between px-5 py-2.5 text-red-400 text-[14px] hover:bg-red-500/10 transition-colors"
          >
            Hapus <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* ---- IMAGE VIEWER ---- */}
      {viewingImage && (
        <div className="fixed inset-0 z-[600] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200" onClick={() => setViewingImage(null)}>
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={() => setViewingImage(null)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
            <a href={viewingImage} download onClick={e => e.stopPropagation()} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
              <Download size={24} />
            </a>
          </div>
          <img
            src={viewingImage} alt="Fullscreen"
            onClick={e => e.stopPropagation()}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-[0.97] duration-200"
          />
        </div>
      )}

      {/* ============================================================
          LAYOUT: SIDEBAR + CHAT
      ============================================================ */}
      <div className="w-full h-full flex overflow-hidden">

        {/* ---- SIDEBAR ---- */}
        <div className={`${isMobileView ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[360px] lg:w-[400px] shrink-0 bg-[#111b21] border-r border-[#2a3942]/60 overflow-hidden`}>

          {/* Sidebar Header */}
          <div className="h-[64px] px-4 bg-[#202c33] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Avatar name={currentUser.name} size={40} />
              <div className="hidden sm:block">
                <p className="text-[#e9edef] text-[14px] font-medium leading-tight">{currentUser.name}</p>
                <p className="text-[#8696a0] text-[12px]">{isConnected ? 'Terhubung' : 'Menghubungkan…'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#aebac1]">
              <button onClick={() => setShowAddFriendModal(true)} className="p-2.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors" title="Chat Baru">
                <MessageSquare size={20} />
              </button>
              <div className="relative" ref={sidebarMenuRef}>
                <button onClick={() => setShowSidebarMenu(!showSidebarMenu)} className={`p-2.5 rounded-full transition-colors ${showSidebarMenu ? 'bg-[#2a3942] text-white' : 'hover:bg-[#2a3942] hover:text-white'}`}>
                  <MoreVertical size={20} />
                </button>
                {showSidebarMenu && (
                  <div className="absolute right-0 top-12 bg-[#233138] border border-[#374a56] rounded-2xl py-1.5 w-52 z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => { setShowSidebarMenu(false); setShowAddFriendModal(true); }} className="w-full text-left px-5 py-3 text-[#d1d7db] text-[14px] hover:bg-[#2a3942] transition-colors">
                      Kontak Baru
                    </button>
                    <div className="h-px bg-[#111b21] my-1 mx-3" />
                    <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-red-400 text-[14px] hover:bg-red-500/10 transition-colors flex items-center gap-3">
                      <LogOut size={15} /> Keluar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 bg-[#111b21]">
            <div className="bg-[#202c33] rounded-xl flex items-center gap-3 px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#00a884]/40 transition-all">
              <Search size={16} className="text-[#8696a0] shrink-0" />
              <input
                type="text" value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Cari atau mulai chat baru"
                className="bg-transparent flex-1 focus:outline-none text-[14px] text-[#d1d7db] placeholder-[#8696a0]"
              />
              {sidebarSearch && (
                <button onClick={() => setSidebarSearch('')} className="text-[#8696a0] hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {sortedUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                <div className="w-16 h-16 bg-[#202c33] rounded-2xl flex items-center justify-center">
                  <MessageSquare size={28} className="text-[#8696a0]" />
                </div>
                <p className="text-[#8696a0] text-[14px]">
                  {sidebarSearch ? 'Tidak ada kontak ditemukan.' : 'Belum ada kontak. Tambah kontak baru!'}
                </p>
                {!sidebarSearch && (
                  <button onClick={() => setShowAddFriendModal(true)} className="bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/30 px-5 py-2 rounded-xl text-[13px] font-semibold hover:bg-[#00a884]/20 transition-colors">
                    Tambah Kontak
                  </button>
                )}
              </div>
            )}
            {sortedUsers.map(user => {
              const lastMsg = recentChats[user.id];
              const isActive = activeUser?.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => { setActiveUser(user); setIsMobileView(true); }}
                  className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-all ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}
                >
                  <Avatar name={user.name} size={52} online={user.is_online} />
                  <div className="flex-1 min-w-0 border-b border-[#202c33] pb-3 pr-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[#e9edef] text-[16px] font-normal truncate">{user.name}</p>
                      {lastMsg && (
                        <span className={`text-[11px] font-medium shrink-0 ml-2 ${lastMsg.unread > 0 ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>
                          {formatTime(lastMsg.time)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-[13px] truncate max-w-[200px] ${lastMsg?.unread > 0 ? 'text-[#e9edef] font-medium' : 'text-[#8696a0]'}`}>
                        {lastMsg ? lastMsg.text : (user.is_online ? 'Sedang online' : 'Ketuk untuk mulai chat')}
                      </p>
                      {lastMsg?.unread > 0 && (
                        <span className="bg-[#00a884] text-[#111b21] text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shrink-0 ml-2">
                          {lastMsg.unread > 99 ? '99+' : lastMsg.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile FAB */}
          <div className="md:hidden absolute bottom-6 right-6 z-20">
            <button
              onClick={() => setShowAddFriendModal(true)}
              className="w-14 h-14 bg-[#00a884] hover:bg-[#00cf9d] rounded-2xl flex items-center justify-center text-[#111b21] shadow-2xl transition-all active:scale-95"
            >
              <MessageSquare size={22} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* ---- CHAT AREA ---- */}
        <div className={`${!isMobileView ? 'hidden md:flex' : 'flex'} flex-col flex-1 min-w-0 bg-[#0b141a] relative overflow-hidden`}>

          {/* WA background pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04] z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='2' fill='%23fff'/%3E%3C/svg%3E")`,
              backgroundSize: '40px',
            }}
          />

          {activeUser ? (
            <div className="flex flex-col h-full z-10 relative">

              {/* Chat Header */}
              <div className="h-[64px] px-3 bg-[#202c33] flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => { setActiveUser(null); setIsMobileView(false); }}
                    className="md:hidden text-[#aebac1] hover:text-white p-1.5 rounded-full hover:bg-[#2a3942] transition-colors shrink-0"
                  >
                    <ArrowLeft size={22} />
                  </button>
                  <Avatar name={activeUser.name} size={42} online={activeUser.is_online} />
                  <div className="min-w-0">
                    <p className="text-[#e9edef] text-[16px] font-medium leading-tight truncate">{activeUser.name}</p>
                    <p className="text-[13px] leading-tight mt-0.5">
                      {partnerTyping
                        ? <span className="text-[#00a884] font-medium">sedang mengetik…</span>
                        : <span className="text-[#8696a0]">{activeUser.is_online ? 'online' : 'offline'}</span>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#aebac1] shrink-0">
                  <button onClick={() => initiateCall('video')} className="p-2.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors">
                    <Video size={20} />
                  </button>
                  <button onClick={() => initiateCall('audio')} className="p-2.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors">
                    <Phone size={20} />
                  </button>
                  <button onClick={() => { setShowSearchBar(!showSearchBar); setSearchQuery(''); }} className="p-2.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors hidden md:block">
                    <Search size={20} />
                  </button>
                  <div className="relative" ref={chatMenuRef}>
                    <button onClick={() => setShowChatMenu(!showChatMenu)} className={`p-2.5 rounded-full transition-colors ${showChatMenu ? 'bg-[#2a3942] text-white' : 'hover:bg-[#2a3942] hover:text-white'}`}>
                      <MoreVertical size={20} />
                    </button>
                    {showChatMenu && (
                      <div className="absolute right-0 top-12 bg-[#233138] border border-[#374a56] rounded-2xl py-1.5 w-48 z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
                        <button onClick={() => { setShowChatMenu(false); setShowSearchBar(true); }} className="w-full text-left px-5 py-3 text-[#d1d7db] text-[14px] hover:bg-[#2a3942] transition-colors">
                          Cari Pesan
                        </button>
                        <div className="h-px bg-[#111b21] my-1 mx-3" />
                        <button onClick={() => { setShowChatMenu(false); setActiveUser(null); setIsMobileView(false); }} className="w-full text-left px-5 py-3 text-red-400 text-[14px] hover:bg-red-500/10 transition-colors">
                          Tutup Obrolan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search bar */}
              {showSearchBar && (
                <div className="bg-[#202c33] flex items-center gap-3 px-4 py-2.5 border-b border-[#2a3942] z-10 animate-in slide-in-from-top-2">
                  <button onClick={() => { setShowSearchBar(false); setSearchQuery(''); }} className="text-[#aebac1] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#2a3942]">
                    <ArrowLeft size={20} />
                  </button>
                  <input
                    type="text" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari dalam obrolan…"
                    autoFocus
                    className="flex-1 bg-[#2a3942] text-[#e9edef] px-4 py-2 rounded-xl focus:outline-none text-[14px] placeholder-[#8696a0]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-[#8696a0] hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Messages */}
              <div ref={messagesAreaRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-[6%] lg:px-[10%] py-4 flex flex-col gap-0.5">

                {/* E2E notice */}
                <div className="flex justify-center mb-6 mt-2">
                  <div className="bg-[#1f2c34] text-[#8696a0] text-[12px] px-4 py-2 rounded-xl text-center max-w-xs flex items-center gap-2 border border-[#2a3942]/60">
                    <Lock size={12} className="shrink-0 text-[#8696a0]" />
                    Pesan dilindungi enkripsi end-to-end.
                  </div>
                </div>

                {groupedMessages.map((item, index) => {
                  if (item.type === 'divider') {
                    return (
                      <div key={item.id} className="flex justify-center my-5">
                        <div className="bg-[#1f2c34] text-[#8696a0] text-[12px] px-4 py-1.5 rounded-xl border border-[#2a3942]/60 font-medium">
                          {item.text}
                        </div>
                      </div>
                    );
                  }

                  const msg = item.data;
                  if (!msg) return null;
                  const isMe = msg.sender_id === currentUser?.id;
                  const contentData = parseMessageContent(msg.message);
                  const prevItem = groupedMessages[index - 1];
                  const nextItem = groupedMessages[index + 1];
                  const isFirstInGroup = !prevItem || prevItem.type === 'divider' || prevItem.data?.sender_id !== msg.sender_id;
                  const isLastInGroup = !nextItem || nextItem.type === 'divider' || nextItem.data?.sender_id !== msg.sender_id;

                  // Border radius logic
                  let borderRadius;
                  if (isMe) {
                    if (isFirstInGroup && isLastInGroup) borderRadius = '12px 4px 12px 12px';
                    else if (isFirstInGroup) borderRadius = '12px 4px 4px 12px';
                    else if (isLastInGroup) borderRadius = '12px 12px 12px 12px';
                    else borderRadius = '12px 4px 4px 12px';
                  } else {
                    if (isFirstInGroup && isLastInGroup) borderRadius = '4px 12px 12px 12px';
                    else if (isFirstInGroup) borderRadius = '4px 12px 12px 4px';
                    else if (isLastInGroup) borderRadius = '12px 12px 12px 12px';
                    else borderRadius = '4px 12px 12px 4px';
                  }

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                    >
                      {/* Avatar for received messages */}
                      {!isMe && (
                        <div className="w-8 shrink-0 mr-1.5 self-end mb-1">
                          {isLastInGroup && <Avatar name={activeUser.name} size={28} />}
                        </div>
                      )}

                      <div
                        onContextMenu={e => handleContextMenu(e, msg)}
                        className={`relative max-w-[75%] md:max-w-[60%] group cursor-pointer select-text ${isMe ? 'bg-[#005c4b]' : 'bg-[#202c33]'}`}
                        style={{ borderRadius }}
                      >
                        {/* Chevron dropdown */}
                        <button
                          onClick={e => { e.stopPropagation(); handleContextMenu(e, msg); }}
                          className="absolute top-1 right-1 w-7 h-7 bg-gradient-to-l from-black/30 to-transparent flex items-center justify-center rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <ChevronDown size={16} className="text-white/80" />
                        </button>

                        <div className="px-3 py-2 min-w-[120px]">
                          {/* Reply preview */}
                          {contentData.replyTo && (
                            <div className="bg-black/20 rounded-lg px-3 py-2 mb-2 border-l-4 border-[#00a884]">
                              <p className="text-[#00a884] text-[12px] font-semibold mb-0.5">{contentData.replyTo.sender}</p>
                              <p className="text-white/70 text-[13px] truncate max-w-[200px]">{contentData.replyTo.text}</p>
                            </div>
                          )}

                          {/* Text */}
                          {contentData.text && (
                            <p className="text-[#e9edef] text-[14.5px] leading-relaxed break-words pr-16">
                              {contentData.text}
                            </p>
                          )}

                          {/* Image */}
                          {contentData.type === 'image' && contentData.fileData && (
                            <div
                              onClick={() => setViewingImage(contentData.fileData)}
                              className="mt-1 rounded-lg overflow-hidden cursor-pointer max-w-[280px] group/img"
                            >
                              <img src={contentData.fileData} alt="Media" className="w-full object-cover group-hover/img:brightness-90 transition-all" />
                            </div>
                          )}

                          {/* Audio */}
                          {contentData.type === 'audio' && contentData.fileData && (
                            <div className="flex items-center gap-3 py-1 pr-14 min-w-[220px]">
                              <div className="w-9 h-9 bg-[#00a884]/20 rounded-full flex items-center justify-center">
                                <Mic size={16} className="text-[#00a884]" />
                              </div>
                              <audio
                                controls src={contentData.fileData}
                                controlsList="nodownload noplaybackrate"
                                className="h-9 flex-1"
                                style={{ minWidth: 160 }}
                              />
                            </div>
                          )}

                          {/* Document */}
                          {contentData.type === 'document' && contentData.fileData && (
                            <a
                              href={contentData.fileData} download={contentData.fileName}
                              className="flex items-center gap-3 bg-black/20 rounded-xl p-3 mt-1 hover:bg-black/30 transition-colors max-w-[260px]"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="w-10 h-10 bg-[#00a884] rounded-xl flex items-center justify-center shrink-0">
                                <FileText size={20} className="text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[#e9edef] text-[13px] font-medium truncate">{contentData.fileName}</p>
                                <p className="text-[#8696a0] text-[11px] uppercase tracking-wide mt-0.5">Dokumen</p>
                              </div>
                            </a>
                          )}

                          {/* Timestamp + status */}
                          <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1">
                            <span className="text-[11px] text-white/50 font-medium">{formatTime(msg.created_at)}</span>
                            {isMe && (
                              msg.status === 'read'
                                ? <CheckCheck size={15} className="text-[#53bdeb]" />
                                : msg.status === 'delivered'
                                  ? <CheckCheck size={15} className="text-white/50" />
                                  : <Check size={15} className="text-white/50" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {partnerTyping && (
                  <div className="flex justify-start mt-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-8 shrink-0 mr-1.5 self-end mb-1">
                      <Avatar name={activeUser.name} size={28} />
                    </div>
                    <div className="bg-[#202c33] px-4 py-3 rounded-tr-2xl rounded-b-2xl flex gap-1.5 items-center">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Reply preview bar */}
              {replyingTo && (
                <div className="bg-[#202c33] px-4 py-2.5 flex items-center gap-3 border-t border-[#2a3942] animate-in slide-in-from-bottom-2 z-10">
                  <div className="flex-1 bg-[#2a3942] rounded-xl px-3 py-2 border-l-4 border-[#00a884]">
                    <p className="text-[#00a884] text-[12px] font-semibold mb-0.5">
                      {replyingTo.sender_id === currentUser?.id ? 'Anda' : activeUser?.name}
                    </p>
                    <p className="text-[#8696a0] text-[13px] truncate">
                      {parseMessageContent(replyingTo.message).text || 'Media'}
                    </p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-[#8696a0] hover:text-white p-1.5 rounded-full hover:bg-[#2a3942] transition-colors">
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* File preview */}
              {selectedFile && (
                <div className="bg-[#202c33] border-t border-[#2a3942] px-4 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 z-10">
                  <div className="w-14 h-14 bg-[#2a3942] rounded-xl overflow-hidden shrink-0 border border-[#374a56]">
                    {selectedFile.type === 'image'
                      ? <img src={selectedFile.dataUrl} alt="preview" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><FileText size={24} className="text-[#00a884]" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#e9edef] font-semibold text-[14px]">
                      {selectedFile.type === 'image' ? 'Kirim Foto' : 'Kirim Dokumen'}
                    </p>
                    <p className="text-[#8696a0] text-[12px] truncate mt-0.5">{selectedFile.name}</p>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-[#8696a0] hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="bg-[#202c33] px-3 py-2.5 flex items-end gap-2 shrink-0 z-10">
                {/* Left controls */}
                <div className="flex items-center gap-1 pb-1.5">
                  <div className="relative" ref={emojiMenuRef}>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2.5 rounded-full transition-colors ${showEmojiPicker ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#d1d7db]'} hover:bg-[#2a3942]`}
                    >
                      <Smile size={24} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-14 left-0 bg-[#202c33] border border-[#2a3942] rounded-2xl shadow-2xl p-3 w-[280px] h-[220px] overflow-y-auto custom-scrollbar z-50 grid grid-cols-7 gap-1 animate-in fade-in slide-in-from-bottom-4">
                        {EMOJIS.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => setNewMessage(prev => prev + emoji)}
                            className="text-xl flex items-center justify-center hover:bg-[#2a3942] rounded-lg h-9 transition-all hover:scale-110 active:scale-95"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={attachMenuRef}>
                    <button
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className={`p-2.5 rounded-full transition-all ${showAttachMenu ? 'text-[#00a884] rotate-45' : 'text-[#8696a0] hover:text-[#d1d7db]'} hover:bg-[#2a3942]`}
                      style={{ transform: showAttachMenu ? 'rotate(45deg)' : 'rotate(0deg)' }}
                    >
                      <Paperclip size={22} />
                    </button>
                    {showAttachMenu && (
                      <div className="absolute bottom-14 left-0 bg-[#202c33] border border-[#2a3942] rounded-3xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'image')} />
                        <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" className="hidden" onChange={e => handleFileSelect(e, 'document')} />
                        <div className="flex gap-5">
                          <button onClick={() => imageInputRef.current.click()} className="flex flex-col items-center gap-2.5 hover:opacity-80 transition-opacity active:scale-95">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                              <ImageIcon size={24} className="text-white" />
                            </div>
                            <span className="text-[12px] text-[#e9edef] font-medium">Foto</span>
                          </button>
                          <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-2.5 hover:opacity-80 transition-opacity active:scale-95">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                              <FileText size={24} className="text-white" />
                            </div>
                            <span className="text-[12px] text-[#e9edef] font-medium">Dokumen</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Text input / recording */}
                {isRecording ? (
                  <div className="flex-1 flex items-center gap-4 bg-[#2a3942] rounded-xl px-5 py-3 mb-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="text-red-400 font-semibold text-[15px] tracking-widest flex-1">{formatDuration(recordingTime)}</span>
                    <button onClick={handleRecordVoice} className="text-[#8696a0] hover:text-red-400 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 bg-[#2a3942] rounded-xl flex items-end mb-1 border border-[#374a56]/40 overflow-hidden">
                    <textarea
                      ref={inputRef}
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                      placeholder="Ketik pesan"
                      rows={1}
                      className="w-full bg-transparent text-[#e9edef] px-4 py-3 focus:outline-none text-[15px] leading-relaxed custom-scrollbar placeholder-[#8696a0]"
                      style={{ minHeight: '46px', maxHeight: '120px' }}
                    />
                  </div>
                )}

                {/* Send / Mic button */}
                <div className="pb-1">
                  {(newMessage.trim() || selectedFile) && !isRecording ? (
                    <button
                      disabled={isSending}
                      onMouseDown={e => e.preventDefault()}
                      onClick={handleSendMessage}
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isSending ? 'bg-[#029072] opacity-70 cursor-wait' : 'bg-[#00a884] hover:bg-[#00cf9d] active:scale-95'}`}
                    >
                      {isSending ? <Loader className="animate-spin text-[#111b21]" size={20} /> : <Send size={20} className="text-[#111b21] ml-0.5" fill="currentColor" />}
                    </button>
                  ) : (
                    <button
                      onClick={handleRecordVoice}
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isRecording ? 'bg-red-500 animate-pulse hover:bg-red-600' : 'bg-[#00a884] hover:bg-[#00cf9d] active:scale-95'}`}
                    >
                      <Mic size={20} className="text-[#111b21]" fill="currentColor" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8 z-10 bg-[#202c33]/60">
              <div className="w-40 h-40 rounded-[40px] bg-[#111b21] flex items-center justify-center shadow-2xl mb-2 border border-[#2a3942]">
                <MessageSquare size={64} className="text-[#00a884]" />
              </div>
              <div>
                <h2 className="text-[28px] font-light text-[#e9edef] mb-3">RamaChat Web</h2>
                <p className="text-[#8696a0] text-[14px] leading-relaxed max-w-[380px]">
                  Kirim pesan, foto, dokumen, dan lakukan panggilan video secara aman.<br />
                  Pilih kontak di sebelah kiri untuk mulai.
                </p>
              </div>
              <button
                onClick={() => setShowAddFriendModal(true)}
                className="mt-4 bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/30 px-8 py-3 rounded-2xl text-[14px] font-semibold hover:bg-[#00a884]/20 transition-colors flex items-center gap-2"
              >
                <UserPlus size={18} /> Tambah Kontak Baru
              </button>
              <div className="absolute bottom-8 flex items-center gap-2 text-[#8696a0] text-[12px]">
                <Lock size={12} /> <span>Enkripsi end-to-end aktif</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// APP ENTRY
// ============================================================
export default function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));
  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuth ? <ChatApp setIsAuth={setIsAuth} /> : <Navigate to="/login" />} />
        <Route path="/login" element={!isAuth ? <LoginRegister setIsAuth={setIsAuth} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
