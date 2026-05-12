import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

import { 
    Send, User, Check, CheckCheck, Loader, MoreVertical, 
    MessageSquare, Search, ArrowLeft, Paperclip, Smile, Lock,
    Image as ImageIcon, FileText, CircleDashed, X, Download, Maximize2, Minimize2,
    Mic, MicOff, Phone, PhoneOff, Video, VideoOff, ChevronDown, Reply, Copy, Trash2,
    BellRing, UserPlus, Play, Square, Pause
} from 'lucide-react';

// === KONFIGURASI DEPLOYMENT (VERCEL & VITE FIX) ===
let API_URL = 'http://localhost:5000/api';
let SOCKET_URL = 'http://localhost:5000';

try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        API_URL = import.meta.env.VITE_API_URL || API_URL;
        SOCKET_URL = import.meta.env.VITE_SOCKET_URL || SOCKET_URL;
    }
} catch (error) {
    console.warn("Menggunakan URL fallback lokal");
}

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// --- HELPER FUNCTIONS ---
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
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateDivider = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "HARI INI";
    if (date.toDateString() === yesterday.toDateString()) return "KEMARIN";
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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
                    replyTo: parsed.replyTo || null
                };
            }
        }
    } catch (e) {}
    return { type: 'text', text: String(rawMessage) };
};

const EMOJIS = ['😀','😂','🤣','😍','🙏','😘','🥰','😊','😎','😢','😭','😡','😠','👍','👎','❤️','🔥','🎉','✨','💯', '🤝', '🙌', '🤔', '👀'];

// --- COMPONENTS ---

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
                alert('Registrasi sukses! Silakan login untuk memulai.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Terjadi kesalahan pada server saat registrasi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col relative selection:bg-[#00a884] selection:text-white font-sans overflow-hidden w-full bg-[#111b21] h-[100dvh]">
            <div className="absolute top-0 left-0 w-full h-[222px] bg-[#00a884] z-0 transition-all duration-500 shadow-md"></div>
            <div className="relative z-10 flex flex-col items-center flex-1 justify-center p-4 animate-in fade-in duration-700">
                <div className="w-full max-w-[1000px] flex items-center justify-start mb-8 gap-3 text-white px-4 drop-shadow-md">
                    <MessageSquare size={32} fill="white" className="text-transparent animate-pulse" />
                    <span className="text-[15px] font-medium tracking-wide uppercase">RamaChat Web</span>
                </div>
                <div className="bg-[#111b21] md:bg-[#202c33] p-8 md:p-12 rounded-[24px] shadow-2xl w-full max-w-[1000px] flex flex-col md:flex-row items-center gap-12 animate-in zoom-in-[0.97] duration-500 ease-out border border-[#2a3942]/50">
                    <div className="flex-1 text-left hidden md:block">
                        <h1 className="text-4xl font-light text-[#e9edef] mb-6 tracking-wide leading-tight">Gunakan RamaChat di komputer & perangkat Anda</h1>
                        <ol className="text-[#8696a0] text-[16px] space-y-5 font-medium list-decimal ml-5 mt-8">
                            <li className="pl-2">Buka RamaChat di perangkat ini.</li>
                            <li className="pl-2">Daftar akun baru atau masuk jika sudah punya.</li>
                            <li className="pl-2">Nikmati obrolan & panggilan video dengan aman.</li>
                        </ol>
                    </div>
                    <div className="w-full max-w-sm flex-shrink-0 relative">
                        <div className="bg-[#111b21] p-8 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#2a3942] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00a884] to-[#029072]"></div>
                            <div className="text-center mb-8 mt-2">
                                <h2 className="text-2xl font-semibold text-[#e9edef]">{isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
                            </div>
                            {error && <div className="bg-red-500/10 border-l-4 border-red-500 text-red-400 p-3 mb-6 text-sm flex items-center gap-2 animate-in slide-in-from-top-2"><X size={16}/> {error}</div>}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {!isLogin && (
                                    <div className="relative group">
                                        <input type="text" id="name" required className="w-full bg-[#202c33] text-[#e9edef] px-4 py-3.5 rounded-lg border border-[#2a3942] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/50 focus:outline-none transition-all peer placeholder-transparent" placeholder="Nama" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        <label htmlFor="name" className="absolute left-4 top-3.5 text-[#8696a0] text-[15px] transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#00a884] peer-focus:bg-[#202c33] peer-focus:px-1 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-[#202c33] peer-valid:px-1 cursor-text">Nama Tampilan</label>
                                    </div>
                                )}
                                <div className="relative group">
                                    <input type="email" id="email" required className="w-full bg-[#202c33] text-[#e9edef] px-4 py-3.5 rounded-lg border border-[#2a3942] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/50 focus:outline-none transition-all peer placeholder-transparent" placeholder="Email" onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    <label htmlFor="email" className="absolute left-4 top-3.5 text-[#8696a0] text-[15px] transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#00a884] peer-focus:bg-[#202c33] peer-focus:px-1 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-[#202c33] peer-valid:px-1 cursor-text">Alamat Email</label>
                                </div>
                                <div className="relative group">
                                    <input type="password" id="password" required className="w-full bg-[#202c33] text-[#e9edef] px-4 py-3.5 rounded-lg border border-[#2a3942] focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/50 focus:outline-none transition-all peer placeholder-transparent" placeholder="Password" onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    <label htmlFor="password" className="absolute left-4 top-3.5 text-[#8696a0] text-[15px] transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#00a884] peer-focus:bg-[#202c33] peer-focus:px-1 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-[#202c33] peer-valid:px-1 cursor-text">Kata Sandi</label>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-[#00a884] hover:bg-[#029072] text-[#111b21] font-bold py-3.5 px-4 rounded-lg transition-all flex justify-center items-center mt-2 shadow-lg hover:shadow-xl active:scale-[0.98]">{loading ? <Loader className="animate-spin w-5 h-5" /> : (isLogin ? 'Masuk ke Obrolan' : 'Daftar Sekarang')}</button>
                            </form>
                            <p className="text-center text-[#8696a0] mt-6 text-[14px]">
                                {isLogin ? "Belum punya akun?" : "Sudah punya akun?"} <button onClick={() => setIsLogin(!isLogin)} className="text-[#00a884] font-medium hover:text-[#029072] transition-colors ml-1">{isLogin ? 'Daftar di sini' : 'Masuk di sini'}</button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ChatApp = ({ setIsAuth }) => {
    const [splashLoading, setSplashLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [users, setUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    
    // Recent chats and unread count tracker
    const [recentChats, setRecentChats] = useState({});

    const [isTyping, setIsTyping] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSending, setIsSending] = useState(false); 
    const [replyingTo, setReplyingTo] = useState(null);
    
    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordTimerRef = useRef(null);
    
    const [isMobileView, setIsMobileView] = useState(false);
    const [leftDrawer, setLeftDrawer] = useState('chats'); 
    const [rightDrawer, setRightDrawer] = useState(null); 
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

    const [callState, setCallState] = useState({
        status: 'idle', type: 'audio', partner: null, duration: 0, isMuted: false, isVideoOff: false, offer: null
    });
    const [isCallMinimized, setIsCallMinimized] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

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
    
    let currentUser = { name: 'Pengguna', email: '', id: null };
    try {
        const currentUserStr = localStorage.getItem('user');
        if (currentUserStr) currentUser = { ...currentUser, ...JSON.parse(currentUserStr) };
    } catch(e) {}

    // Initial Splash Screen Effect
    useEffect(() => {
        setTimeout(() => setSplashLoading(false), 1500);
    }, []);

    useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const newSocket = io(SOCKET_URL, { 
            auth: { token }, 
            reconnectionAttempts: 5,
            transports: ['websocket']
        });
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

        newSocket.on('incoming_call', async (data) => {
            if (data.type === 'answer') {
                if (peerConnectionRef.current && data.answer) {
                    try { await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer)); } 
                    catch(err) { console.error("Error setting remote answer", err); }
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
        
        newSocket.on('call_accepted', () => { 
            setCallState(prev => ({ ...prev, status: 'connected' })); 
            startCallTimer(); 
        });
        
        newSocket.on('call_rejected', () => { alert("Panggilan ditolak."); endCallLocally(); });
        newSocket.on('call_ended', () => { endCallLocally(); });

        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                if (Array.isArray(res.data)) {
                    // Coba susun berdasarkan kontak yang ada secara lokal jika memungkinkan
                    setUsers(res.data);
                }
            } catch (err) {}
        };
        fetchUsers();

        return () => { clearInterval(callTimerRef.current); newSocket.close(); };
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleReceive = (msg) => {
            if (!msg) return; 
            try {
                const decryptedMsg = { ...msg, message: decryptMessage(msg.message) };
                const parsedContent = parseMessageContent(decryptedMsg.message);
                
                // Update Unread Tracker & Recent Chat
                setRecentChats(prev => {
                    const senderId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
                    const isActive = activeUserRef.current?.id === senderId;
                    let textPreview = parsedContent.text;
                    if(parsedContent.type === 'audio') textPreview = '🎤 Pesan Suara';
                    if(parsedContent.type === 'image') textPreview = '📷 Gambar';
                    if(parsedContent.type === 'document') textPreview = '📄 Dokumen';

                    return {
                        ...prev,
                        [senderId]: {
                            text: textPreview || 'Media',
                            time: msg.created_at,
                            unread: isActive ? 0 : (prev[senderId]?.unread || 0) + 1
                        }
                    };
                });

                // Update Messages if Active
                setMessages(prev => {
                    const currUser = activeUserRef.current;
                    if (currUser && (msg.sender_id === currUser.id || msg.receiver_id === currUser.id)) {
                        socket.emit('mark_read', { senderId: msg.sender_id });
                        return [...prev, decryptedMsg];
                    }
                    return prev;
                });
            } catch(e) {}
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

    useEffect(() => {
        if (!activeUser) return;
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/messages/${activeUser.id}`);
                if (Array.isArray(res.data)) {
                    let lastMsgText = '';
                    let lastMsgTime = '';
                    const decryptedHistory = res.data.filter(m => m !== null).map(m => {
                        try { 
                            const dMsg = { ...m, message: decryptMessage(m.message) }; 
                            // Setup preview data for recent history on load
                            const parsed = parseMessageContent(dMsg.message);
                            lastMsgText = parsed.text || (parsed.type === 'audio' ? '🎤 Pesan Suara' : parsed.type === 'image' ? '📷 Gambar' : '📄 Dokumen');
                            lastMsgTime = dMsg.created_at;
                            return dMsg;
                        } catch(e) { return m; }
                    });
                    setMessages(decryptedHistory);
                    
                    if (lastMsgText) {
                        setRecentChats(prev => ({
                            ...prev,
                            [activeUser.id]: { text: lastMsgText, time: lastMsgTime, unread: 0 }
                        }));
                    }
                    socket?.emit('mark_read', { senderId: activeUser.id });
                }
                setRightDrawer(null); setReplyingTo(null); setShowChatMenu(false);
            } catch (err) {}
        };
        fetchHistory();
    }, [activeUser, socket]);

    useEffect(() => {
        if (messagesEndRef.current && !rightDrawer) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages, partnerTyping, replyingTo]);

    useEffect(() => {
        const handleClick = (e) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) setShowAttachMenu(false);
            if (emojiMenuRef.current && !emojiMenuRef.current.contains(e.target)) setShowEmojiPicker(false);
            if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(e.target)) setShowSidebarMenu(false);
            if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) setShowChatMenu(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const startCallTimer = () => {
        clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => { setCallState(prev => ({ ...prev, duration: prev.duration + 1 })); }, 1000);
    };

    const requestMedia = async (withVideo) => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Browser ini tidak mendukung akses Kamera/Mikrofon.");
                return null;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
            setLocalStream(stream);
            return stream;
        } catch (err) {
            alert("Gagal mengakses Kamera/Mikrofon. Pastikan izin telah diberikan.");
            return null;
        }
    };

    const gatherIce = (pc, callback) => {
        let resolved = false;
        const finish = () => {
            if (!resolved) {
                resolved = true;
                callback(pc.localDescription);
            }
        };
        pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') finish();
        };
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
        
        pc.ontrack = (event) => { setRemoteStream(event.streams[0]); };

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            gatherIce(pc, (finalOffer) => {
                socket?.emit('call_user', { receiverId: activeUser.id, caller: currentUser, type, offer: finalOffer });
            });
        } catch (err) {}
    };

    const acceptCall = async () => {
        const stream = await requestMedia(callState.type === 'video');
        if (!stream) { endCallLocally(); return; }
        
        socket?.emit('accept_call', { callerId: callState.partner?.id });
        
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnectionRef.current = pc;
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        
        pc.ontrack = (event) => { setRemoteStream(event.streams[0]); };

        if (callState.offer) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                
                gatherIce(pc, (finalAnswer) => {
                    socket?.emit('call_user', { receiverId: callState.partner.id, type: 'answer', answer: finalAnswer });
                });
            } catch (err) {}
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
        if (localStream) { localStream.getTracks().forEach(track => track.stop()); setLocalStream(null); }
        setRemoteStream(null);
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (callState.status !== 'idle' && callState.partner) {
            socket?.emit('end_call', { partnerId: callState.partner.id });
        }
        setIsCallMinimized(false);
        setCallState({ status: 'idle', type: 'audio', partner: null, duration: 0, isMuted: false, isVideoOff: false, offer: null });
    };

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled })); }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled })); }
        }
    };

    useEffect(() => {
        if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream;
        if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    }, [localStream, remoteStream, callState.status, isCallMinimized]);


    // --- Voice Note Features ---
    const handleRecordVoice = async () => {
        if (isRecording) {
            // Stop Recording
            if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
            clearInterval(recordTimerRef.current);
            setIsRecording(false);
            setRecordingTime(0);
        } else {
            // Start Recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];
                
                mediaRecorder.ondataavailable = e => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        handleSendMessage(null, reader.result, 'audio', 'Voice Note');
                    }
                    stream.getTracks().forEach(track => track.stop());
                };
                
                mediaRecorder.start();
                setIsRecording(true);
                setRecordingTime(0);
                recordTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
            } catch (err) {
                alert("Izin mikrofon ditolak atau perangkat tidak mendukung.");
            }
        }
    };


    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.pageX, y: e.pageY, msg });
    };

    const handleDeleteMessage = (msgId) => {
        socket.emit('delete_message', msgId);
        setMessages(prev => prev.filter(m => m.id !== msgId));
        setContextMenu(null);
    };

    const handleSearchFriend = async () => {
        if (!friendSearchQuery.trim()) return;
        try {
            const res = await api.get(`/users/search?q=${friendSearchQuery}`);
            setFriendSearchResults(res.data);
        } catch (err) {}
    };

    const handleAddFriend = (user) => {
        if (!users.find(u => u.id === user.id)) setUsers(prev => [user, ...prev]);
        setActiveUser(user);
        setShowAddFriendModal(false);
        setIsMobileView(true);
        setFriendSearchQuery('');
        setFriendSearchResults([]);
    };

    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                if (type === 'image') {
                    const canvas = document.createElement('canvas');
                    let width = img.width, height = img.height;
                    if (width > height) { if (width > 800) { height *= 800 / width; width = 800; } } 
                    else { if (height > 800) { width *= 800 / height; height = 800; } }
                    canvas.width = width; canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    setSelectedFile({ dataUrl: canvas.toDataURL('image/jpeg', 0.5), type, name: file.name });
                } else {
                    setSelectedFile({ dataUrl: event.target.result, type, name: file.name });
                }
                setShowAttachMenu(false); inputRef.current?.focus();
            };
            if(type !== 'image') {
                setSelectedFile({ dataUrl: event.target.result, type, name: file.name });
                setShowAttachMenu(false); inputRef.current?.focus();
            }
        };
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const handleSendMessage = async (e, forceData = null, forceType = null, forceName = null) => {
        if(e) e.preventDefault();
        const textContent = newMessage.trim();
        const hasMedia = selectedFile || forceData;
        
        if ((!textContent && !hasMedia) || !activeUser || isSending) return;
        setIsSending(true);

        const payloadObj = {
            type: forceType || (selectedFile ? selectedFile.type : 'text'),
            text: textContent,
            fileData: forceData || (selectedFile ? selectedFile.dataUrl : null),
            fileName: forceName || (selectedFile ? selectedFile.name : null),
            replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender_id === currentUser.id ? 'Anda' : activeUser.name, text: parseMessageContent(replyingTo.message).text || 'Media' } : null
        };
        const stringPayload = JSON.stringify(payloadObj);
        
        // Update Recent Chat locally immediately for faster UI
        setRecentChats(prev => ({
            ...prev,
            [activeUser.id]: {
                text: textContent || (payloadObj.type === 'audio' ? '🎤 Pesan Suara' : '📷 Media'),
                time: new Date().toISOString(),
                unread: 0
            }
        }));

        setNewMessage(''); setSelectedFile(null); setReplyingTo(null); setIsTyping(false); setShowEmojiPicker(false);
        socket?.emit('stop_typing', { receiverId: activeUser.id });

        try {
            const res = await api.post('/messages', { receiverId: activeUser.id, message: encryptMessage(stringPayload) });
            setMessages(prev => [...prev, { ...res.data, message: stringPayload }]);
            // Prevent keyboard close
            setTimeout(() => inputRef.current?.focus(), 100);
        } catch (err) { alert("Gagal mengirim. Payload mungkin kebesaran."); } 
        finally { setIsSending(false); }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (!activeUser || !socket) return;
        if (!isTyping) { setIsTyping(true); socket.emit('typing', { receiverId: activeUser.id }); }
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false); socket.emit('stop_typing', { receiverId: activeUser.id });
        }, 1500);
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(sidebarSearch.toLowerCase()) || u.email.toLowerCase().includes(sidebarSearch.toLowerCase()));
    
    // Urutkan kontak berdasarkan pesan terbaru
    const sortedUsers = useMemo(() => {
        return [...filteredUsers].sort((a, b) => {
            const timeA = recentChats[a.id]?.time ? new Date(recentChats[a.id].time).getTime() : 0;
            const timeB = recentChats[b.id]?.time ? new Date(recentChats[b.id].time).getTime() : 0;
            return timeB - timeA;
        });
    }, [filteredUsers, recentChats]);

    const groupedMessages = useMemo(() => {
        const groups = [];
        let currentDate = null;
        const filteredMsg = searchQuery ? messages.filter(m => {
            if(!m) return false;
            return String(parseMessageContent(m.message).text).toLowerCase().includes(searchQuery.toLowerCase());
        }) : messages;

        filteredMsg.forEach(msg => {
            if (!msg || !msg.created_at) return;
            const msgDate = new Date(msg.created_at).toDateString();
            if (msgDate !== currentDate) {
                groups.push({ type: 'divider', text: formatDateDivider(msg.created_at), id: `div-${msg.id || Math.random()}` });
                currentDate = msgDate;
            }
            groups.push({ type: 'message', data: msg });
        });
        return groups;
    }, [messages, searchQuery]);


    return (
        <div className="flex w-full bg-[#111b21] text-[#e9edef] overflow-hidden font-sans selection:bg-[#00a884] selection:text-white relative" style={{ height: '100dvh' }}>
            
            {/* Splash Screen */}
            {splashLoading && (
                <div className="fixed inset-0 z-[1000] bg-[#111b21] flex flex-col items-center justify-center animate-out fade-out duration-500 fill-mode-forwards pointer-events-none" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-[#00a884] to-[#029072] rounded-3xl shadow-2xl mb-8 animate-pulse">
                        <MessageSquare size={48} fill="white" className="text-white" />
                    </div>
                    <div className="flex flex-col items-center absolute bottom-12 opacity-80">
                        <span className="text-[#8696a0] text-sm mb-2">from</span>
                        <div className="flex items-center gap-2 text-white font-semibold tracking-wider text-xl">
                            <span className="text-[#00a884]">RAMA</span>CHAT
                        </div>
                    </div>
                </div>
            )}

            {/* In-Call Minimized Overlay */}
            {isCallMinimized && callState.status !== 'idle' && (
                <div 
                    onClick={() => setIsCallMinimized(false)}
                    className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-24 h-36 bg-black rounded-xl shadow-2xl border-2 border-[#00a884] z-[350] overflow-hidden cursor-pointer hover:scale-105 transition-transform animate-in slide-in-from-bottom-5 fade-in group"
                >
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                        <Maximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {callState.type === 'video' && remoteStream ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#202c33]">
                            <User size={32} className="text-[#00a884] mb-2" />
                            <span className="text-[10px] text-white font-medium bg-black/50 px-2 py-0.5 rounded-full">{formatDuration(callState.duration)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Call Screen (Full) */}
            {!isCallMinimized && callState.status === 'receiving' && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-10 w-[90%] md:w-80 bg-[#202c33] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#2a3942] z-[400] overflow-hidden animate-in slide-in-from-top-10 fade-in duration-500">
                    <div className="bg-[#0b141a] p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#00a884] opacity-20 animate-pulse"></div>
                        <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[#00a884] to-[#029072] rounded-full flex items-center justify-center text-white mb-4 shadow-lg ring-4 ring-[#00a884]/30 animate-pulse"><User size={40} /></div>
                        <h3 className="text-white text-xl font-medium drop-shadow-md">{callState.partner?.name || 'Kontak'}</h3>
                        <p className="text-[#00a884] text-[15px] font-medium flex items-center justify-center gap-2 mt-2 tracking-wide"><BellRing size={16} className="animate-bounce" /> Panggilan {callState.type === 'video' ? 'Video' : 'Suara'}...</p>
                    </div>
                    <div className="flex justify-around p-6 bg-[#111b21]">
                        <button onClick={rejectCall} className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-transform hover:scale-110 active:scale-95"><PhoneOff size={24} /></button>
                        <button onClick={acceptCall} className="w-14 h-14 bg-[#00a884] hover:bg-[#029072] rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,168,132,0.4)] transition-transform hover:scale-110 active:scale-95 animate-bounce"><Phone size={24} fill="currentColor" /></button>
                    </div>
                </div>
            )}

            {!isCallMinimized && (callState.status === 'calling' || callState.status === 'connected') && (
                <div className="fixed inset-0 z-[400] bg-[#0b141a] flex flex-col items-center justify-between animate-in fade-in zoom-in-[0.98] duration-300">
                    <button onClick={() => setIsCallMinimized(true)} className="absolute top-8 left-8 z-50 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all"><Minimize2 size={24} /></button>
                    
                    {callState.type === 'audio' && <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0b141a] to-[#202c33] opacity-90"></div>}
                    {callState.type === 'video' && (
                        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
                            {remoteStream ? (
                                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover animate-in fade-in duration-1000"></video>
                            ) : (
                                <div className="text-white flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-4 border-[#00a884] rounded-full animate-spin border-t-transparent"></div>
                                        <div className="absolute inset-0 flex items-center justify-center"><User size={32} className="text-[#00a884]"/></div>
                                    </div>
                                    <p className="animate-pulse tracking-wide font-medium text-lg">Menghubungkan Video...</p>
                                </div>
                            )}
                            
                            {callState.status === 'connected' && (
                                <div className="absolute bottom-[130px] right-6 w-32 h-48 md:w-48 md:h-72 bg-black rounded-2xl overflow-hidden border-2 border-[#2a3942] shadow-2xl z-20 animate-in slide-in-from-right-4 duration-500 hover:scale-105 transition-transform cursor-move">
                                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100"></video>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="relative z-10 w-full p-8 flex flex-col items-center mt-12 drop-shadow-lg pointer-events-none">
                        <div className="flex items-center gap-2 text-[#aebac1] mb-6 bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md"><Lock size={12}/> <span className="text-xs uppercase tracking-widest font-medium">End-to-End Encrypted</span></div>
                        {callState.type === 'audio' && <div className="w-36 h-36 bg-gradient-to-tr from-[#6b7c85] to-[#8696a0] rounded-full flex items-center justify-center text-white shadow-2xl mb-6 relative overflow-hidden"><User size={64} className="mt-2"/><div className="absolute inset-0 bg-white opacity-0 animate-pulse rounded-full"></div></div>}
                        <h2 className="text-4xl font-medium text-white mb-2 shadow-black drop-shadow-lg">{callState.partner?.name || 'Kontak'}</h2>
                        <p className="text-[#00a884] text-lg font-medium tracking-widest bg-black/40 px-5 py-1.5 rounded-full backdrop-blur-md shadow-inner">{callState.status === 'calling' ? 'Memanggil...' : formatDuration(callState.duration)}</p>
                    </div>
                    <div className="relative z-10 w-full p-10 flex items-center justify-center gap-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-16">
                        <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-105 shadow-lg ${callState.isVideoOff ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{callState.isVideoOff ? <VideoOff size={24}/> : <Video size={24}/>}</button>
                        <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-105 shadow-lg ${callState.isMuted ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{callState.isMuted ? <MicOff size={24}/> : <Mic size={24}/>}</button>
                        <button onClick={endCallLocally} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:bg-red-600 hover:scale-110 active:scale-95 transition-all ml-6"><PhoneOff size={28}/></button>
                    </div>
                </div>
            )}

            {showAddFriendModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in p-4">
                    <div className="bg-[#202c33] border border-[#2a3942] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-[0.95] duration-300">
                        <div className="bg-[#111b21] p-5 flex justify-between items-center border-b border-[#2a3942]">
                            <h2 className="text-[#e9edef] text-xl font-medium flex items-center gap-3"><UserPlus size={24} className="text-[#00a884]"/> Kontak Baru</h2>
                            <button onClick={() => setShowAddFriendModal(false)} className="text-[#8696a0] hover:text-white transition-colors bg-[#2a3942] p-1.5 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-[#8696a0] text-[15px] mb-5">Cari kontak untuk memulai obrolan baru dengan aman.</p>
                            <div className="flex gap-2 mb-6">
                                <input type="text" value={friendSearchQuery} onChange={e => setFriendSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchFriend()} placeholder="Cari nama atau email..." className="flex-1 bg-[#111b21] border border-[#2a3942] rounded-xl px-4 py-3 text-[#e9edef] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/50 transition-all"/>
                                <button onClick={handleSearchFriend} className="bg-[#00a884] hover:bg-[#029072] text-[#111b21] px-5 rounded-xl font-medium transition-colors shadow-md active:scale-95"><Search size={20}/></button>
                            </div>
                            <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                {friendSearchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3.5 bg-[#111b21] rounded-xl mb-3 hover:bg-[#2a3942]/50 transition-colors border border-transparent hover:border-[#2a3942]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-tr from-[#6b7c85] to-[#8696a0] rounded-full flex items-center justify-center shadow-inner"><User size={24} className="text-white opacity-90 mt-1"/></div>
                                            <div><p className="text-[#e9edef] text-[16px] font-medium leading-tight">{user.name}</p><p className="text-[#8696a0] text-[13px] mt-0.5">{user.email}</p></div>
                                        </div>
                                        <button onClick={() => handleAddFriend(user)} className="text-[#00a884] hover:text-[#111b21] hover:bg-[#00a884] border border-[#00a884] px-4 py-1.5 rounded-lg text-sm font-medium transition-all">Chat</button>
                                    </div>
                                ))}
                                {friendSearchResults.length === 0 && friendSearchQuery && <p className="text-center text-[#8696a0] text-[15px] py-4">Pengguna tidak ditemukan.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {contextMenu && (
                <div 
                    onMouseDown={(e) => e.stopPropagation()} 
                    className="fixed z-[300] bg-[#2a3942] border border-[#374a56] shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-xl py-2 min-w-[180px] text-[15px] text-[#d1d7db] animate-in fade-in zoom-in-[0.95] duration-150 backdrop-blur-xl" 
                    style={{ 
                        top: Math.min(contextMenu.y, window.innerHeight - 180), 
                        left: Math.min(contextMenu.x, window.innerWidth - 200) 
                    }}
                >
                    <button onClick={(e) => { 
                        e.stopPropagation();
                        setReplyingTo(contextMenu.msg); 
                        setContextMenu(null); 
                        setTimeout(() => inputRef.current?.focus(), 100);
                    }} className="w-full text-left px-5 py-2.5 hover:bg-[#202c33] hover:text-white transition-colors flex justify-between items-center group">Balas <Reply size={18} className="text-[#8696a0] group-hover:text-white"/></button>
                    
                    <button onClick={(e) => { 
                        e.stopPropagation();
                        const textToCopy = parseMessageContent(contextMenu.msg.message).text;
                        if (textToCopy) {
                            if (navigator.clipboard && window.isSecureContext) {
                                navigator.clipboard.writeText(textToCopy);
                            } else {
                                const textArea = document.createElement("textarea");
                                textArea.value = textToCopy;
                                document.body.appendChild(textArea);
                                textArea.select();
                                try { document.execCommand('copy'); } catch (err) {}
                                textArea.remove();
                            }
                        }
                        setContextMenu(null); 
                    }} className="w-full text-left px-5 py-2.5 hover:bg-[#202c33] hover:text-white transition-colors flex justify-between items-center group">Salin <Copy size={18} className="text-[#8696a0] group-hover:text-white"/></button>
                    
                    <div className="h-[1px] bg-[#111b21] my-1 opacity-50"></div>
                    <button onClick={(e) => { 
                        e.stopPropagation();
                        handleDeleteMessage(contextMenu.msg.id); 
                    }} className="w-full text-left px-5 py-2.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors flex justify-between items-center group">Hapus <Trash2 size={18} className="group-hover:scale-110 transition-transform"/></button>
                </div>
            )}

            {viewingImage && (
                <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300 backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                        <button onClick={() => setViewingImage(null)} className="text-white hover:bg-white/20 p-3 rounded-full transition-colors"><ArrowLeft size={28}/></button>
                        <a href={viewingImage} download className="text-white hover:bg-white/20 p-3 rounded-full transition-colors"><Download size={28}/></a>
                    </div>
                    <img src={viewingImage} alt="Fullscreen" className="max-w-[95%] max-h-[90%] object-contain animate-in zoom-in-[0.98] duration-300 drop-shadow-2xl rounded-sm" />
                </div>
            )}

            {/* Background hijau pembatas khas WhatsApp */}
            <div className="absolute top-0 left-0 w-full h-[127px] bg-[#202c33] md:bg-[#00a884] z-0 transition-all duration-500"></div>

            <div className="md:p-4 lg:p-5 w-full h-full flex items-center justify-center relative z-10">
                <div className="w-full h-full max-w-[1600px] flex shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden md:rounded-[24px] relative bg-[#111b21] animate-in zoom-in-[0.99] duration-500 border border-[#2a3942]/40">
                    
                    {/* --- KIRI: DAFTAR CHAT --- */}
                    <div className={`${isMobileView ? '-translate-x-full absolute md:relative md:translate-x-0 hidden' : 'flex'} md:flex flex-col w-full md:w-[35%] lg:w-[30%] min-w-[340px] max-w-[440px] h-full border-r border-[#2a3942]/60 bg-[#111b21] transition-transform duration-300 z-10 relative overflow-hidden`}>
                        <div className="h-[64px] px-4 bg-[#202c33] flex justify-between items-center shrink-0 shadow-sm relative z-20">
                            <div className="w-10 h-10 bg-gradient-to-tr from-[#8696a0] to-[#6b7c85] rounded-full flex items-center justify-center font-semibold text-white cursor-pointer hover:opacity-90 shadow-inner overflow-hidden">
                                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User size={24} className="mt-1 opacity-80"/>}
                            </div>
                            <div className="flex gap-2 text-[#aebac1]">
                                <button className="p-2 rounded-full hover:bg-[#2a3942] transition-colors"><CircleDashed size={22}/></button>
                                <button onClick={() => setShowAddFriendModal(true)} className="p-2 rounded-full hover:bg-[#2a3942] transition-colors"><MessageSquare size={22}/></button>
                                <div className="relative" ref={sidebarMenuRef}>
                                    <button onClick={() => setShowSidebarMenu(!showSidebarMenu)} className={`p-2 rounded-full transition-colors ${showSidebarMenu ? 'bg-[#2a3942]' : 'hover:bg-[#2a3942]'}`}><MoreVertical size={22}/></button>
                                    {showSidebarMenu && (
                                        <div className="absolute right-0 top-12 bg-[#2a3942] border border-[#374a56] shadow-2xl rounded-xl py-2 w-52 z-50 animate-in fade-in slide-in-from-top-2">
                                            <button onClick={() => { setShowSidebarMenu(false); setShowAddFriendModal(true); }} className="w-full text-left px-5 py-3 hover:bg-[#202c33] transition-colors text-[#d1d7db] text-[15px] font-medium">Kontak Baru</button>
                                            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full text-left px-5 py-3 hover:bg-[#202c33] transition-colors text-red-400 text-[15px] font-medium">Keluar</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-3 border-b border-[#202c33] bg-[#111b21] z-10 shadow-[0_2px_5px_rgba(0,0,0,0.1)]">
                            <div className="bg-[#202c33] rounded-xl flex items-center px-4 py-2 focus-within:bg-[#111b21] border border-transparent focus-within:border-[#00a884] transition-all shadow-inner group">
                                <Search size={18} className="text-[#8696a0] mr-4 group-focus-within:text-[#00a884] transition-colors"/>
                                <input type="text" value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} placeholder="Cari atau mulai chat baru" className="bg-transparent flex-1 focus:outline-none text-[15px] py-0.5 text-[#d1d7db] placeholder-[#8696a0]" />
                            </div>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 bg-[#111b21] custom-scrollbar pb-20">
                            {sortedUsers.map((user) => {
                                const lastMsgInfo = recentChats[user.id];
                                const isActive = activeUser?.id === user.id;
                                return (
                                    <div key={user.id} onClick={() => { setActiveUser(user); setIsMobileView(true); setRightDrawer(null); }}
                                         className={`flex items-center px-3 py-3 cursor-pointer transition-all hover:bg-[#202c33] ${isActive ? 'bg-[#2a3942] hover:bg-[#2a3942]' : ''}`}>
                                        <div className="relative shrink-0 ml-1">
                                            <div className="w-[52px] h-[52px] bg-gradient-to-br from-[#6b7c85] to-[#8696a0] rounded-full flex items-center justify-center text-white overflow-hidden shadow-inner"><User size={30} className="opacity-80 mt-1"/></div>
                                            {user.is_online && <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#00a884] border-2 border-[#111b21] rounded-full"></div>}
                                        </div>
                                        <div className="ml-4 flex-1 border-b border-[#202c33] pb-3 pr-3 flex flex-col justify-center h-full pt-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="text-[17px] text-[#e9edef] font-normal leading-tight">{user.name}</h3>
                                                {lastMsgInfo && <span className={`text-[12px] font-medium ${lastMsgInfo.unread > 0 ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>{formatTime(lastMsgInfo.time)}</span>}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className={`text-[14px] truncate max-w-[200px] leading-snug ${lastMsgInfo?.unread > 0 ? 'text-[#e9edef] font-medium' : 'text-[#8696a0]'}`}>
                                                    {lastMsgInfo ? lastMsgInfo.text : (user.is_online ? 'Sedang online' : 'Ketuk untuk mulai chat')}
                                                </p>
                                                {lastMsgInfo?.unread > 0 && (
                                                    <div className="bg-[#00a884] text-[#111b21] text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                                                        {lastMsgInfo.unread}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Mobile FAB */}
                        <div className="absolute bottom-6 right-6 md:hidden">
                             <button onClick={() => setShowAddFriendModal(true)} className="w-14 h-14 bg-[#00a884] rounded-2xl flex items-center justify-center text-[#111b21] shadow-2xl hover:scale-105 active:scale-95 transition-transform"><MessageSquare size={24} fill="currentColor" /></button>
                        </div>
                    </div>

                    {/* --- KANAN: RUANG CHAT --- */}
                    <div className={`${!isMobileView ? 'translate-x-full absolute md:relative md:translate-x-0 hidden' : 'flex'} md:flex flex-col flex-1 w-full h-full bg-[#0b141a] transition-transform duration-300 z-20 relative overflow-hidden`}>
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_Q_kJuvCW3.png')", backgroundSize: '412px' }}></div>

                        {activeUser ? (
                            <div className="flex flex-col h-full z-10 w-full relative animate-in fade-in duration-300">
                                {/* Header Obrolan */}
                                <div className="h-[64px] px-4 bg-[#202c33] flex items-center justify-between shrink-0 shadow-sm z-30">
                                    <div className="flex items-center gap-4 cursor-pointer hover:bg-[#2a3942]/50 p-1.5 -ml-1.5 rounded-xl transition-colors">
                                        <button onClick={(e) => { e.stopPropagation(); setActiveUser(null); setIsMobileView(false); }} className="md:hidden text-[#aebac1] hover:text-white p-1 rounded-full"><ArrowLeft size={24}/></button>
                                        <div className="relative">
                                            <div className="w-11 h-11 bg-gradient-to-tr from-[#6b7c85] to-[#8696a0] rounded-full flex items-center justify-center text-white overflow-hidden shadow-inner"><User size={26} className="opacity-90 mt-1"/></div>
                                            {activeUser.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#202c33] rounded-full shadow-sm"></div>}
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h2 className="text-[16px] text-[#e9edef] font-medium leading-tight">{activeUser.name}</h2>
                                            <p className="text-[13px] text-[#8696a0] leading-tight mt-1">{partnerTyping ? <span className="text-[#00a884] font-medium animate-pulse">sedang mengetik...</span> : (activeUser.is_online ? 'online' : 'terakhir dilihat hari ini')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 text-[#aebac1] mr-1 md:mr-2">
                                        <button onClick={() => initiateCall('video')} className="p-2.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors"><Video size={22} fill="currentColor" /></button>
                                        <button onClick={() => initiateCall('audio')} className="p-2.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors"><Phone size={20} fill="currentColor" /></button>
                                        <div className="h-6 w-[1px] bg-[#2a3942] my-auto mx-1 hidden md:block"></div>
                                        <button onClick={() => setRightDrawer(rightDrawer === 'search' ? null : 'search')} className="p-2.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors hidden md:block"><Search size={22}/></button>
                                        
                                        <div className="relative" ref={chatMenuRef}>
                                            <button onClick={() => setShowChatMenu(!showChatMenu)} className={`p-2.5 rounded-full transition-colors ${showChatMenu ? 'bg-[#2a3942] text-white' : 'hover:bg-[#2a3942] hover:text-white'}`}><MoreVertical size={22}/></button>
                                            {showChatMenu && (
                                                <div className="absolute right-0 top-12 bg-[#2a3942] border border-[#374a56] shadow-2xl rounded-xl py-2 w-48 z-50 animate-in fade-in slide-in-from-top-2 text-[#d1d7db]">
                                                    <button onClick={() => { setShowChatMenu(false); setRightDrawer('search'); }} className="w-full text-left px-5 py-3 hover:bg-[#202c33] transition-colors text-[15px] font-medium">Cari Pesan</button>
                                                    <button onClick={() => { setShowChatMenu(false); setActiveUser(null); setIsMobileView(false); }} className="w-full text-left px-5 py-3 hover:bg-[#202c33] transition-colors text-red-400 text-[15px] font-medium">Tutup Obrolan</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {rightDrawer === 'search' && (
                                    <div className="bg-[#202c33] p-3 border-b border-[#2a3942] z-20 flex items-center gap-4 animate-in slide-in-from-top-2 shadow-md">
                                        <button onClick={() => { setRightDrawer(null); setSearchQuery(''); }} className="text-[#aebac1] hover:text-white p-1 rounded-full"><ArrowLeft size={22}/></button>
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari pesan..." autoFocus className="flex-1 bg-[#111b21] text-[#e9edef] px-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#00a884]/50 border border-[#2a3942]" />
                                    </div>
                                )}

                                {/* Area Pesan */}
                                <div className="flex-1 overflow-y-auto px-[4%] md:px-[8%] py-6 custom-scrollbar flex flex-col gap-1.5 z-10 relative">
                                    <div className="flex justify-center mb-8 mt-4">
                                        <div className="bg-[#ffeecd] text-[#54421b] text-[12.5px] px-5 py-2.5 rounded-[10px] text-center flex items-center gap-2.5 shadow-sm font-medium animate-in fade-in duration-700 max-w-sm leading-relaxed border border-[#54421b]/10">
                                            <Lock size={16} className="shrink-0 text-[#54421b]/80" />
                                            <span>Pesan dan panggilan diamankan dengan enkripsi *end-to-end*. Pihak ketiga tidak bisa membaca atau mendengarkannya.</span>
                                        </div>
                                    </div>
                                    
                                    {groupedMessages.map((item, index) => {
                                        if (item.type === 'divider') return <div key={item.id} className="flex justify-center my-4"><div className="bg-[#202c33] text-[#8696a0] text-[12px] font-medium px-4 py-1.5 rounded-lg uppercase tracking-wider shadow-sm border border-[#2a3942]">{item.text}</div></div>;
                                        const msg = item.data;
                                        if (!msg) return null;

                                        const isMe = msg.sender_id === currentUser?.id;
                                        const contentData = parseMessageContent(msg.message);
                                        const prevItem = groupedMessages[index - 1];
                                        const isFirstInGroup = !prevItem || prevItem.type === 'divider' || prevItem.data?.sender_id !== msg.sender_id;

                                        return (
                                            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                                <div onContextMenu={(e) => handleContextMenu(e, msg)} className={`relative max-w-[85%] md:max-w-[70%] text-[15px] shadow-sm leading-relaxed group ${isMe ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#202c33] text-[#e9edef]'} ${isMe && isFirstInGroup ? 'rounded-l-xl rounded-br-xl rounded-tr-sm' : ''} ${isMe && !isFirstInGroup ? 'rounded-xl' : ''} ${!isMe && isFirstInGroup ? 'rounded-r-xl rounded-bl-xl rounded-tl-sm' : ''} ${!isMe && !isFirstInGroup ? 'rounded-xl' : ''} transition-all`}>
                                                    
                                                    {/* Tail Buble */}
                                                    {isFirstInGroup && isMe && <div className="absolute top-0 -right-[8px] w-[8px] h-[13px] text-[#005c4b]"><svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor"><path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path></svg></div>}
                                                    {isFirstInGroup && !isMe && <div className="absolute top-0 -left-[8px] w-[8px] h-[13px] text-[#202c33]"><svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor"><path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" transform="scale(-1, 1) translate(-8, 0)"></path></svg></div>}

                                                    {/* Dropdown chevron */}
                                                    <div onClick={(e) => { e.stopPropagation(); handleContextMenu(e, msg); }} className="absolute top-1 right-1 cursor-pointer bg-gradient-to-l from-black/20 via-black/10 to-transparent pl-5 pr-2 py-1 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-opacity z-20"><ChevronDown size={20} className="text-white/90 hover:text-white" /></div>

                                                    <div className="flex flex-col min-w-[120px] z-10 relative p-2 px-2.5">
                                                        {contentData.replyTo && (
                                                            <div onClick={() => {}} className="bg-black/15 rounded-lg p-2.5 mb-1.5 border-l-[5px] border-[#00a884] flex flex-col cursor-pointer hover:bg-black/25 transition-colors shadow-inner">
                                                                <span className="text-[#00a884] font-semibold text-[13.5px] leading-tight">{contentData.replyTo.sender || ''}</span>
                                                                <span className="text-white/80 text-[14px] truncate max-w-[220px] mt-0.5">{String(contentData.replyTo.text || '')}</span>
                                                            </div>
                                                        )}
                                                        
                                                        {contentData.text && <span className="pr-[70px] pt-1 break-words">{String(contentData.text)}</span>}
                                                        
                                                        {contentData.type === 'audio' && contentData.fileData && (
                                                            <div className="flex items-center gap-3 pr-[50px] pt-1 pb-1 min-w-[220px]">
                                                                <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center relative overflow-hidden text-[#00a884]">
                                                                    <Mic size={20} fill="currentColor"/>
                                                                </div>
                                                                <audio controls src={contentData.fileData} controlsList="nodownload noplaybackrate" className="h-10 w-[180px] custom-audio-player opacity-90"></audio>
                                                            </div>
                                                        )}

                                                        {contentData.type === 'image' && contentData.fileData && <div onClick={() => setViewingImage(contentData.fileData)} className="mt-1 rounded-lg max-h-[350px] overflow-hidden relative group/img cursor-pointer shadow-sm"><img src={contentData.fileData} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" alt="Media"/></div>}
                                                        
                                                        {contentData.type === 'document' && contentData.fileData && <a href={contentData.fileData} download={contentData.fileName} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl mt-1.5 cursor-pointer hover:bg-black/30 transition-colors border border-white/5"><div className="w-10 h-10 bg-[#00a884] rounded-lg flex items-center justify-center shadow-md"><FileText size={22} className="text-white" fill="white"/></div><div className="flex-1 overflow-hidden"><p className="text-[14.5px] font-semibold truncate text-[#e9edef]">{contentData.fileName}</p><p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Document</p></div></a>}
                                                        
                                                        {/* Timestamp & Tick */}
                                                        <div className="text-[11px] text-white/60 text-right absolute bottom-1.5 right-2.5 flex items-center gap-1 font-medium tracking-wide">
                                                            <span>{formatTime(msg.created_at)}</span>
                                                            {isMe && (msg.status === 'read' ? <CheckCheck size={16} className="text-[#53bdeb] ml-0.5"/> : msg.status === 'delivered' ? <CheckCheck size={16} className="text-white/70 ml-0.5"/> : <Check size={16} className="text-white/70 ml-0.5"/>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {partnerTyping && (
                                        <div className="flex justify-start mt-3 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="bg-[#202c33] rounded-r-xl rounded-bl-xl rounded-tl-sm px-4 py-3 shadow-sm text-[#00a884] flex gap-1.5 items-center w-fit border border-[#2a3942]/50">
                                                <span className="w-2 h-2 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-[#00a884] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} className="h-6" />
                                </div>

                                {/* Preview Balasan */}
                                {replyingTo && (
                                    <div className="bg-[#202c33] px-4 pt-3 -mb-1 z-20 flex animate-in slide-in-from-bottom-2">
                                        <div className="flex-1 bg-[#111b21] rounded-xl p-3 border-l-[5px] border-[#00a884] flex items-center justify-between shadow-[0_5px_15px_rgba(0,0,0,0.15)] relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#2a3942]/20 to-transparent pointer-events-none"></div>
                                            <div className="flex flex-col text-[14px]">
                                                <span className="text-[#00a884] font-semibold mb-0.5">{replyingTo.sender_id === currentUser?.id ? 'Anda' : activeUser?.name || 'Kontak'}</span>
                                                <span className="text-[#8696a0] truncate max-w-[250px] md:max-w-md">{String(parseMessageContent(replyingTo.message).text || 'Pesan Media')}</span>
                                            </div>
                                            <button onClick={() => setReplyingTo(null)} className="p-2 text-[#8696a0] hover:text-white hover:bg-[#2a3942] rounded-full transition-colors z-10"><X size={20}/></button>
                                        </div>
                                    </div>
                                )}

                                {/* Preview Attachment */}
                                {selectedFile && (
                                    <div className="bg-[#202c33] border-t border-[#2a3942] p-4 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.2)] z-30 animate-in slide-in-from-bottom-5">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-16 h-16 bg-[#111b21] rounded-xl border border-[#2a3942] flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                                                {selectedFile.type === 'image' ? <img src={selectedFile.dataUrl} alt="preview" className="w-full h-full object-cover" /> : <FileText size={32} className="text-[#00a884]" />}
                                            </div>
                                            <div className="truncate text-[#e9edef] flex flex-col justify-center">
                                                <p className="font-semibold text-[15px] tracking-wide">{selectedFile.type === 'image' ? 'Kirim Gambar' : 'Kirim Dokumen'}</p>
                                                <p className="truncate text-[#8696a0] text-[13px] mt-0.5">{selectedFile.name}</p>
                                            </div>
                                        </div>
                                        <button disabled={isSending} onClick={() => setSelectedFile(null)} className="p-3 bg-[#2a3942] hover:bg-red-500/20 rounded-full text-[#8696a0] hover:text-red-400 transition-colors shadow-sm"><X size={20} /></button>
                                    </div>
                                )}

                                {/* Input Area */}
                                <div className="bg-[#202c33] min-h-[64px] px-3 py-2.5 flex items-end gap-2 shrink-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                                    <div className="flex gap-1 text-[#8696a0] items-center pb-2 px-1">
                                        <div className="relative" ref={emojiMenuRef}>
                                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-[#2a3942] text-[#00a884]' : 'hover:bg-[#2a3942] hover:text-[#d1d7db]'}`}><Smile size={26}/></button>
                                            {showEmojiPicker && (
                                                <div className="absolute bottom-16 left-0 bg-[#202c33] border border-[#2a3942] rounded-2xl shadow-2xl p-4 w-72 h-72 overflow-y-auto custom-scrollbar z-50 grid grid-cols-6 gap-2 animate-in fade-in slide-in-from-bottom-4">
                                                    {EMOJIS.map((emoji, idx) => (
                                                        <button key={idx} onClick={() => setNewMessage(prev => prev + emoji)} className="text-2xl hover:bg-[#2a3942] rounded-xl p-1.5 transition-transform hover:scale-110 active:scale-95">{emoji}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative" ref={attachMenuRef}>
                                            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-full transition-all duration-300 ${showAttachMenu ? 'bg-[#2a3942] text-white rotate-45' : 'hover:bg-[#2a3942] hover:text-[#d1d7db]'}`}><Paperclip size={24} className="transform transition-transform duration-300"/></button>
                                            {showAttachMenu && (
                                                <div className="absolute bottom-16 left-0 md:-left-4 bg-[#202c33] border border-[#2a3942] rounded-[24px] shadow-2xl p-5 grid grid-cols-2 gap-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 min-w-[300px]">
                                                    <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
                                                    <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx,.xls,.txt" className="hidden" onChange={(e) => handleFileSelect(e, 'document')} />
                                                    <button onClick={() => imageInputRef.current.click()} className="flex flex-col items-center gap-3 hover:bg-[#2a3942] p-4 rounded-3xl transition-all group active:scale-95"><div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><ImageIcon size={28} className="text-white" fill="white" /></div><span className="font-medium text-[14px] text-[#e9edef]">Foto & Video</span></button>
                                                    <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-3 hover:bg-[#2a3942] p-4 rounded-3xl transition-all group active:scale-95"><div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#7F66FF] to-[#A084FF] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><FileText size={28} className="text-white" fill="white" /></div><span className="font-medium text-[14px] text-[#e9edef]">Dokumen</span></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Voice Note Timer UI */}
                                    {isRecording ? (
                                        <div className="flex-1 bg-transparent rounded-xl flex items-center px-4 mb-2 animate-in slide-in-from-right-10 duration-300">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)] mr-4"></div>
                                            <span className="text-red-400 font-medium text-[16px] tracking-widest flex-1">{formatDuration(recordingTime)}</span>
                                            <button onClick={handleRecordVoice} className="text-[#8696a0] hover:text-red-400 p-2"><Trash2 size={22}/></button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 bg-[#2a3942] rounded-xl flex items-center overflow-hidden mb-1.5 shadow-inner focus-within:ring-1 focus-within:ring-[#8696a0]/30 transition-all border border-[#374a56]/50">
                                            <textarea ref={inputRef} value={newMessage} onChange={handleTyping} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} placeholder="Ketik pesan" rows="1" className="w-full bg-transparent text-[#e9edef] px-5 py-3 resize-none focus:outline-none custom-scrollbar text-[15px] leading-relaxed" style={{ minHeight: '48px', maxHeight: '120px' }} />
                                        </div>
                                    )}
                                    
                                    <div className="pb-1.5 pl-2">
                                        {(newMessage.trim() || selectedFile) && !isRecording ? (
                                            <button 
                                                disabled={isSending} 
                                                onMouseDown={(e) => e.preventDefault()} // Fix Mobile Keyboard Close
                                                onClick={handleSendMessage} 
                                                className={`w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isSending ? 'bg-[#029072] opacity-70 cursor-wait' : 'bg-[#00a884] hover:bg-[#029072] hover:scale-105 active:scale-95 text-[#111b21]'}`}
                                            >
                                                {isSending ? <Loader className="animate-spin w-6 h-6 text-[#111b21]"/> : <Send size={24} className="ml-1" fill="currentColor"/>}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={handleRecordVoice}
                                                className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isRecording ? 'bg-red-500 text-white animate-bounce hover:bg-red-600' : 'bg-[#00a884] text-[#111b21] hover:bg-[#029072] hover:scale-105 active:scale-95'}`}
                                            >
                                                {isRecording ? <Send size={22} className="ml-1" fill="currentColor"/> : <Mic size={24} fill="currentColor"/>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10 bg-[#202c33]">
                                <img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669aeJeom.png" alt="WhatsApp" className="w-[340px] opacity-90 mb-10 drop-shadow-2xl animate-in zoom-in-95 duration-1000 pointer-events-none" />
                                <h2 className="text-[34px] font-light text-[#e9edef] mb-5 tracking-wide">RamaChat Web Ultimate</h2>
                                <p className="text-[#8696a0] mt-2 max-w-[500px] text-[15px] leading-relaxed">
                                    Kirim dan terima pesan tanpa perlu menghubungkan telepon Anda ke internet.<br/>
                                    Dilengkapi Panggilan Video, Fitur Balas/Hapus, Voice Note, dan UI Premium.
                                </p>
                                <div className="absolute bottom-12 flex items-center gap-2 text-[#8696a0] text-[13.5px] font-medium tracking-wide opacity-80 bg-black/20 px-4 py-1.5 rounded-full border border-[#2a3942]">
                                    <Lock size={12}/> <span>Dienkripsi End-to-End</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Global Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(134,150,160,0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(134,150,160,0.5); }
                textarea.custom-scrollbar::-webkit-scrollbar { width: 4px; }
                
                /* Custom Audio Player */
                audio.custom-audio-player::-webkit-media-controls-panel {
                    background-color: transparent !important;
                }
                audio.custom-audio-player::-webkit-media-controls-play-button,
                audio.custom-audio-player::-webkit-media-controls-timeline,
                audio.custom-audio-player::-webkit-media-controls-current-time-display,
                audio.custom-audio-player::-webkit-media-controls-time-remaining-display,
                audio.custom-audio-player::-webkit-media-controls-mute-button,
                audio.custom-audio-player::-webkit-media-controls-volume-slider {
                    filter: invert(1) sepia(1) saturate(5) hue-rotate(175deg);
                }
            `}} />
        </div>
    );
};

export default function App() {
    const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));
    return (
        <Router><Routes>
            <Route path="/" element={isAuth ? <ChatApp setIsAuth={setIsAuth} /> : <Navigate to="/login" />} />
            <Route path="/login" element={!isAuth ? <LoginRegister setIsAuth={setIsAuth} /> : <Navigate to="/" />} />
        </Routes></Router>
    );
}
