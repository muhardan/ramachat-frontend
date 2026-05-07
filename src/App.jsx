import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

import { 
    Send, User, Check, CheckCheck, Loader, MoreVertical, 
    MessageSquare, Search, ArrowLeft, Paperclip, Smile, Lock,
    Image as ImageIcon, FileText, CircleDashed, X, Download, Maximize2, 
    Mic, MicOff, Phone, PhoneOff, Video, VideoOff, ChevronDown, Reply, Copy, Trash2, Shield,
    BellRing, UserPlus
} from 'lucide-react';

// === KONFIGURASI DEPLOYMENT (ROBUST VERSION) ===
// Logika ini mendeteksi apakah aplikasi berjalan di Vite (Vercel) atau lingkungan lain
const getEnvVariable = (key, defaultValue) => {
    try {
        // Coba ambil dari import.meta.env (Standard Vite/Vercel)
        // Kita gunakan pengecekan bertahap untuk menghindari error kompilasi
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            return import.meta.env[key];
        }
    } catch (e) {}
    
    // Fallback jika tidak ditemukan
    return defaultValue;
};

const API_URL = getEnvVariable('VITE_API_URL', 'http://localhost:5000/api');
const SOCKET_URL = getEnvVariable('VITE_SOCKET_URL', 'http://localhost:5000');

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
        <div className="min-h-screen w-full bg-[#111b21] flex flex-col relative selection:bg-[#00a884] selection:text-white font-sans overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[222px] bg-[#00a884] z-0 transition-all duration-500"></div>
            <div className="relative z-10 flex flex-col items-center flex-1 justify-center p-4">
                <div className="w-full max-w-[1000px] flex items-center justify-start mb-8 gap-3 text-white px-4">
                    <MessageSquare size={32} fill="white" className="text-transparent" />
                    <span className="text-[14px] font-medium tracking-wide uppercase">RamaChat Web</span>
                </div>
                <div className="bg-[#111b21] md:bg-[#202c33] p-8 md:p-12 rounded-[24px] shadow-2xl w-full max-w-[1000px] flex flex-col md:flex-row items-center gap-12 animate-in zoom-in-[0.95] duration-500 ease-out">
                    <div className="flex-1 text-left hidden md:block">
                        <h1 className="text-3xl font-light text-[#e9edef] mb-6 tracking-wide">Gunakan RamaChat di komputer Anda</h1>
                        <ol className="text-[#8696a0] text-[16px] space-y-4 font-medium list-decimal ml-5">
                            <li>Buka RamaChat di komputer ini.</li>
                            <li>Daftar akun baru atau masuk jika sudah punya.</li>
                            <li>Nikmati obrolan & panggilan video dengan aman.</li>
                        </ol>
                    </div>
                    <div className="w-full max-w-sm flex-shrink-0 relative">
                        <div className="bg-[#111b21] p-8 rounded-[20px] shadow-2xl border border-[#2a3942]">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-semibold text-[#e9edef]">{isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
                            </div>
                            {error && <div className="bg-red-500/10 border-l-4 border-red-500 text-red-400 p-3 mb-6 text-sm flex items-center gap-2 animate-in slide-in-from-top-2"><X size={16}/> {error}</div>}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {!isLogin && <input type="text" placeholder="Nama Tampilan" required className="w-full bg-[#202c33] text-[#e9edef] px-4 py-3 rounded-lg border border-[#2a3942] focus:border-[#00a884] focus:outline-none transition-all placeholder-[#8696a0]" onChange={e => setFormData({ ...formData, name: e.target.value })} />}
                                <input type="email" placeholder="Alamat Email" required className="w-full bg-[#202c33] text-[#e9edef] px-4 py-3 rounded-lg border border-[#2a3942] focus:border-[#00a884] focus:outline-none transition-all placeholder-[#8696a0]" onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                <input type="password" placeholder="Kata Sandi" required className="w-full bg-[#202c33] text-[#e9edef] px-4 py-3 rounded-lg border border-[#2a3942] focus:border-[#00a884] focus:outline-none transition-all placeholder-[#8696a0]" onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                <button type="submit" disabled={loading} className="w-full bg-[#00a884] hover:bg-[#029072] text-[#111b21] font-bold py-3.5 px-4 rounded-lg transition-all flex justify-center items-center mt-2 active:scale-95">{loading ? <Loader className="animate-spin w-5 h-5" /> : (isLogin ? 'Masuk ke Obrolan' : 'Daftar Sekarang')}</button>
                            </form>
                            <p className="text-center text-[#8696a0] mt-6 text-sm">
                                {isLogin ? "Belum punya akun?" : "Sudah punya akun?"} <button onClick={() => setIsLogin(!isLogin)} className="text-[#00a884] font-medium hover:text-[#029072] transition-colors">{isLogin ? 'Daftar di sini' : 'Masuk di sini'}</button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ChatApp = ({ setIsAuth }) => {
    const [socket, setSocket] = useState(null);
    const [users, setUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    
    const [isTyping, setIsTyping] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSending, setIsSending] = useState(false); 
    const [replyingTo, setReplyingTo] = useState(null);
    
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
        status: 'idle', type: 'audio', partner: null, duration: 0, isMuted: false, isVideoOff: false
    });
    const [localStream, setLocalStream] = useState(null);

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
    
    let currentUser = { name: 'Pengguna', email: '', id: null };
    try {
        const currentUserStr = localStorage.getItem('user');
        if (currentUserStr) currentUser = { ...currentUser, ...JSON.parse(currentUserStr) };
    } catch(e) {}

    useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const newSocket = io(SOCKET_URL, { 
            auth: { token }, 
            reconnectionAttempts: 5,
            transports: ['websocket'] // Penting untuk koneksi di Hugging Face
        });
        setSocket(newSocket);

        newSocket.on('connect', () => setIsConnected(true));
        newSocket.on('disconnect', () => setIsConnected(false));

        newSocket.on('user_online', (userId) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_online: true } : u)));
        newSocket.on('user_offline', (userId) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_online: false } : u)));
        newSocket.on('messages_read', ({ readerId }) => setMessages(prev => prev.map(m => m.receiver_id === readerId ? { ...m, status: 'read' } : m)));

        newSocket.on('message_deleted', (msgId) => {
            setMessages(prev => prev.filter(m => m.id !== msgId));
        });

        newSocket.on('incoming_call', (data) => {
            setCallState(prev => {
                if (prev.status === 'idle') return { status: 'receiving', type: data.type, partner: data.caller, duration: 0, isMuted: false, isVideoOff: false };
                return prev;
            });
        });
        
        newSocket.on('call_accepted', () => { setCallState(prev => ({ ...prev, status: 'connected' })); startCallTimer(); });
        newSocket.on('call_rejected', () => { alert("Panggilan ditolak oleh lawan bicara."); endCallLocally(); });
        newSocket.on('call_ended', () => { endCallLocally(); });

        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                if (Array.isArray(res.data)) setUsers(res.data);
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
                    const decryptedHistory = res.data.filter(m => m !== null).map(m => {
                        try { return { ...m, message: decryptMessage(m.message) }; } catch(e) { return m; }
                    });
                    setMessages(decryptedHistory);
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
            if (contextMenu) setContextMenu(null);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [contextMenu]);

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

    const initiateCall = async (type) => {
        if (!activeUser) return;
        const stream = await requestMedia(type === 'video');
        if (!stream) return;
        setCallState({ status: 'calling', type, partner: activeUser, duration: 0, isMuted: false, isVideoOff: false });
        socket?.emit('call_user', { receiverId: activeUser.id, caller: currentUser, type });
    };

    const acceptCall = async () => {
        const stream = await requestMedia(callState.type === 'video');
        if (!stream) { endCallLocally(); return; }
        socket?.emit('accept_call', { callerId: callState.partner?.id });
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
        if (callState.status !== 'idle' && callState.partner) socket?.emit('end_call', { partnerId: callState.partner.id });
        setCallState({ status: 'idle', type: 'audio', partner: null, duration: 0, isMuted: false, isVideoOff: false });
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
        if (localStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = localStream;
    }, [localStream, callState.status]);


    const handleContextMenu = (e, msg) => {
        e.preventDefault();
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
        } catch (err) { console.error(err); }
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

    const handleSendMessage = async (e) => {
        if(e) e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !activeUser || isSending) return;
        setIsSending(true);

        const payloadObj = {
            type: selectedFile ? selectedFile.type : 'text',
            text: newMessage.trim(),
            fileData: selectedFile ? selectedFile.dataUrl : null,
            fileName: selectedFile ? selectedFile.name : null,
            replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender_id === currentUser.id ? 'Anda' : activeUser.name, text: parseMessageContent(replyingTo.message).text || 'Media' } : null
        };
        const stringPayload = JSON.stringify(payloadObj);
        
        setNewMessage(''); setSelectedFile(null); setReplyingTo(null); setIsTyping(false); setShowEmojiPicker(false);
        socket?.emit('stop_typing', { receiverId: activeUser.id });

        try {
            const res = await api.post('/messages', { receiverId: activeUser.id, message: encryptMessage(stringPayload) });
            setMessages(prev => [...prev, { ...res.data, message: stringPayload }]);
        } catch (err) { alert("❌ Gagal mengirim. Payload mungkin kebesaran."); } 
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
        <div className="flex h-screen w-full bg-[#111b21] text-[#e9edef] overflow-hidden font-sans selection:bg-[#00a884] selection:text-white relative">
            
            {callState.status === 'receiving' && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-10 w-[90%] md:w-80 bg-[#202c33] rounded-2xl shadow-2xl border border-[#2a3942] z-[300] overflow-hidden animate-in slide-in-from-top-10 fade-in duration-500">
                    <div className="bg-[#0b141a] p-5 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#00a884] opacity-10 animate-pulse"></div>
                        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-[#00a884] to-[#029072] rounded-full flex items-center justify-center text-white mb-3 shadow-lg ring-4 ring-[#00a884]/30 animate-pulse"><User size={32} /></div>
                        <h3 className="text-white text-lg font-medium">{callState.partner?.name || 'Kontak'}</h3>
                        <p className="text-[#00a884] text-sm flex items-center justify-center gap-2 mt-1"><BellRing size={14} className="animate-bounce" /> Panggilan Masuk...</p>
                    </div>
                    <div className="flex justify-around p-5 bg-[#111b21]">
                        <button onClick={rejectCall} className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95"><PhoneOff size={24} /></button>
                        <button onClick={acceptCall} className="w-14 h-14 bg-[#00a884] hover:bg-[#029072] rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95 animate-bounce">{callState.type === 'video' ? <Video size={24} /> : <Phone size={24} />}</button>
                    </div>
                </div>
            )}

            {(callState.status === 'calling' || callState.status === 'connected') && (
                <div className="fixed inset-0 z-[200] bg-[#0b141a] flex flex-col items-center justify-between animate-in fade-in zoom-in-[0.98] duration-300">
                    {callState.type === 'audio' && <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0b141a] to-[#202c33] opacity-90"></div>}
                    {callState.type === 'video' && (
                        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                            {callState.status === 'connected' && (
                                <div className="absolute bottom-[110px] right-6 w-28 h-40 md:w-44 md:h-64 bg-black rounded-xl overflow-hidden border border-[#2a3942] shadow-2xl z-20 animate-in slide-in-from-right-4 duration-500">
                                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100"></video>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="relative z-10 w-full p-8 flex flex-col items-center mt-12 drop-shadow-lg">
                        <div className="flex items-center gap-2 text-[#aebac1] mb-6 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm"><Lock size={12}/> <span className="text-xs uppercase tracking-widest font-medium">Terenkripsi End-to-End</span></div>
                        {callState.type === 'audio' && <div className="w-32 h-32 bg-gradient-to-tr from-[#6b7c85] to-[#8696a0] rounded-full flex items-center justify-center text-white shadow-2xl mb-6 relative"><User size={56}/>{callState.status === 'calling' && <div className="absolute inset-0 rounded-full border-4 border-[#00a884] animate-ping opacity-50"></div>}</div>}
                        <h2 className="text-3xl font-medium text-white mb-2 shadow-black drop-shadow-md">{callState.partner?.name || 'Kontak'}</h2>
                        <p className="text-[#aebac1] text-lg font-light tracking-wide bg-black/30 px-4 py-1 rounded-full backdrop-blur-sm">{callState.status === 'calling' ? 'Memanggil...' : formatDuration(callState.duration)}</p>
                    </div>
                    <div className="relative z-10 w-full p-10 flex items-center justify-center gap-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-16">
                        <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-105 ${callState.isVideoOff ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{callState.isVideoOff ? <VideoOff size={24}/> : <Video size={24}/>}</button>
                        <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-105 ${callState.isMuted ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{callState.isMuted ? <MicOff size={24}/> : <Mic size={24}/>}</button>
                        <button onClick={endCallLocally} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-red-600 hover:scale-110 active:scale-95 transition-all ml-4"><PhoneOff size={28}/></button>
                    </div>
                </div>
            )}

            {showAddFriendModal && (
                <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center animate-in fade-in p-4">
                    <div className="bg-[#202c33] border border-[#2a3942] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-[#111b21] p-4 flex justify-between items-center border-b border-[#2a3942]">
                            <h2 className="text-[#e9edef] text-lg font-medium flex items-center gap-2"><UserPlus size={20}/> Tambah Teman</h2>
                            <button onClick={() => setShowAddFriendModal(false)} className="text-[#8696a0] hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-[#8696a0] text-sm mb-4">Cari teman berdasarkan username atau email yang sudah terdaftar.</p>
                            <div className="flex gap-2 mb-6">
                                <input type="text" value={friendSearchQuery} onChange={e => setFriendSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchFriend()} placeholder="Ketik email / nama..." className="flex-1 bg-[#111b21] border border-[#2a3942] rounded-lg px-4 py-2 text-[#e9edef] focus:outline-none focus:border-[#00a884]"/>
                                <button onClick={handleSearchFriend} className="bg-[#00a884] hover:bg-[#029072] text-[#111b21] px-4 rounded-lg font-medium transition"><Search size={20}/></button>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {friendSearchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-[#111b21] rounded-lg mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#6b7c85] rounded-full flex items-center justify-center"><User size={20} className="text-white"/></div>
                                            <div><p className="text-[#e9edef] text-sm font-medium">{user.name}</p><p className="text-[#8696a0] text-xs">{user.email}</p></div>
                                        </div>
                                        <button onClick={() => handleAddFriend(user)} className="text-[#00a884] hover:text-[#029072] text-sm font-medium">Chat</button>
                                    </div>
                                ))}
                                {friendSearchResults.length === 0 && friendSearchQuery && <p className="text-center text-[#8696a0] text-sm">Tidak ditemukan.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {contextMenu && (
                <div className="absolute z-50 bg-[#202c33] border border-[#2a3942] shadow-2xl rounded-lg py-2 min-w-[160px] text-[14.5px] text-[#d1d7db] animate-in fade-in zoom-in-95 duration-100" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <button onClick={() => { setReplyingTo(contextMenu.msg); setContextMenu(null); inputRef.current?.focus(); }} className="w-full text-left px-4 py-2 hover:bg-[#111b21] hover:text-white transition flex justify-between items-center">Balas <Reply size={16}/></button>
                    <button onClick={() => { navigator.clipboard.writeText(parseMessageContent(contextMenu.msg.message).text); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-[#111b21] hover:text-white transition flex justify-between items-center">Salin <Copy size={16}/></button>
                    <div className="h-[1px] bg-[#2a3942] my-1"></div>
                    <button onClick={() => handleDeleteMessage(contextMenu.msg.id)} className="w-full text-left px-4 py-2 hover:bg-[#111b21] hover:text-white transition text-red-400 flex justify-between items-center">Hapus Pesan <Trash2 size={16}/></button>
                </div>
            )}

            {viewingImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                        <button onClick={() => setViewingImage(null)} className="text-white hover:bg-white/10 p-2 rounded-full transition"><ArrowLeft size={24}/></button>
                        <a href={viewingImage} download className="text-white hover:bg-white/10 p-2 rounded-full transition"><Download size={24}/></a>
                    </div>
                    <img src={viewingImage} alt="Fullscreen" className="max-w-[90%] max-h-[90%] object-contain animate-in zoom-in-95 duration-200 shadow-2xl" />
                </div>
            )}

            <div className="absolute top-0 left-0 w-full h-[127px] bg-[#00a884] z-0 hidden md:block transition-all duration-500"></div>

            <div className="md:p-4 lg:p-5 w-full h-full flex items-center justify-center relative z-10">
                <div className="w-full h-full max-w-[1600px] flex shadow-2xl overflow-hidden md:rounded-[20px] relative bg-[#111b21] animate-in zoom-in-[0.98] duration-300">
                    
                    <div className={`${isMobileView ? '-translate-x-full absolute md:relative md:translate-x-0 hidden' : 'flex'} md:flex flex-col w-full md:w-[35%] lg:w-[30%] min-w-[320px] max-w-[420px] h-full border-r border-[#202c33] bg-[#111b21] transition-transform duration-300 z-10 relative overflow-hidden`}>
                        <div className="h-[64px] px-4 bg-[#202c33] flex justify-between items-center shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-tr from-[#00a884] to-[#029072] rounded-full flex items-center justify-center font-bold text-white cursor-pointer hover:opacity-90">{currentUser?.name?.charAt(0).toUpperCase() || 'U'}</div>
                            <div className="flex gap-1 text-[#aebac1]">
                                <button className="p-2 rounded-full hover:bg-[#2a3942] transition-colors"><CircleDashed size={20}/></button>
                                <button onClick={() => setShowAddFriendModal(true)} className="p-2 rounded-full hover:bg-[#2a3942] transition-colors"><MessageSquare size={20}/></button>
                                <div className="relative" ref={sidebarMenuRef}>
                                    <button onClick={() => setShowSidebarMenu(!showSidebarMenu)} className="p-2 rounded-full hover:bg-[#2a3942] transition-colors"><MoreVertical size={20}/></button>
                                    {showSidebarMenu && (
                                        <div className="absolute right-0 top-10 bg-[#202c33] border border-[#2a3942] shadow-xl rounded-lg py-2 w-48 z-50 animate-in fade-in">
                                            <button onClick={() => { setShowSidebarMenu(false); setShowAddFriendModal(true); }} className="w-full text-left px-4 py-2 hover:bg-[#111b21] transition text-[#d1d7db]">Tambah Teman</button>
                                            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full text-left px-4 py-2 hover:bg-[#111b21] text-red-400 transition">Keluar (Logout)</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-2 border-b border-[#202c33] bg-[#111b21]">
                            <div className="bg-[#202c33] rounded-lg flex items-center px-4 py-1.5 focus-within:bg-[#111b21] border border-transparent focus-within:border-[#00a884] transition-all">
                                <Search size={18} className="text-[#8696a0] mr-4"/>
                                <input type="text" value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} placeholder="Cari kontak..." className="bg-transparent flex-1 focus:outline-none text-[15px] py-1 text-[#d1d7db]" />
                            </div>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 bg-[#111b21] custom-scrollbar">
                            {filteredUsers.map((user) => (
                                <div key={user.id} onClick={() => { setActiveUser(user); setIsMobileView(true); setRightDrawer(null); }}
                                     className={`flex items-center px-3 py-2 cursor-pointer transition-colors hover:bg-[#202c33] ${activeUser?.id === user.id ? 'bg-[#2a3942] hover:bg-[#2a3942]' : ''}`}>
                                    <div className="relative shrink-0 ml-1">
                                        <div className="w-[48px] h-[48px] bg-[#6b7c85] rounded-full flex items-center justify-center text-white overflow-hidden"><User size={28} className="opacity-80 mt-1"/></div>
                                        {user.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#111b21] rounded-full"></div>}
                                    </div>
                                    <div className="ml-4 flex-1 border-b border-[#202c33] pb-3 pr-2 flex flex-col justify-center h-full pt-3">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h3 className="text-[17px] text-[#e9edef] font-normal">{user.name}</h3>
                                            <span className={`text-[12px] font-medium tracking-wide ${user.is_online ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>{user.is_online ? 'Online' : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`${!isMobileView ? 'translate-x-full absolute md:relative md:translate-x-0 hidden' : 'flex'} md:flex flex-col flex-1 w-full h-full bg-[#0b141a] transition-transform duration-300 z-20 relative overflow-hidden`}>
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_Q_kJuvCW3.png')", backgroundSize: '412px' }}></div>

                        {activeUser ? (
                            <div className="flex flex-col h-full z-10 w-full relative animate-in fade-in duration-300">
                                <div className="h-[64px] px-4 bg-[#202c33] flex items-center justify-between shrink-0 shadow-sm z-20">
                                    <div className="flex items-center gap-4 cursor-pointer">
                                        <button onClick={(e) => { e.stopPropagation(); setActiveUser(null); setIsMobileView(false); }} className="md:hidden text-[#aebac1] hover:text-white p-1 rounded-full"><ArrowLeft size={24}/></button>
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-[#6b7c85] rounded-full flex items-center justify-center text-white overflow-hidden"><User size={24} className="opacity-80 mt-1"/></div>
                                            {activeUser.is_online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] border-2 border-[#202c33] rounded-full"></div>}
                                        </div>
                                        <div className="flex flex-col">
                                            <h2 className="text-[16px] text-[#e9edef] font-medium leading-tight">{activeUser.name}</h2>
                                            <p className="text-[13px] text-[#8696a0] leading-tight mt-0.5">{partnerTyping ? <span className="text-[#00a884] font-medium animate-pulse">sedang mengetik...</span> : (activeUser.is_online ? 'online' : 'offline')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 md:gap-4 text-[#aebac1] mr-2">
                                        <button onClick={() => initiateCall('video')} className="p-2 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors"><Video size={22} fill="currentColor" /></button>
                                        <button onClick={() => initiateCall('audio')} className="p-2 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors"><Phone size={20} fill="currentColor" /></button>
                                        <div className="h-6 w-[1px] bg-[#2a3942] my-auto hidden md:block"></div>
                                        <button onClick={() => setRightDrawer(rightDrawer === 'search' ? null : 'search')} className="p-2 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors hidden md:block"><Search size={22}/></button>
                                        
                                        <div className="relative" ref={chatMenuRef}>
                                            <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-2 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors"><MoreVertical size={20}/></button>
                                            {showChatMenu && (
                                                <div className="absolute right-0 top-10 bg-[#202c33] border border-[#2a3942] shadow-xl rounded-lg py-2 w-48 z-50 animate-in fade-in text-[#d1d7db]">
                                                    <button onClick={() => { setShowChatMenu(false); setRightDrawer('search'); }} className="w-full text-left px-4 py-2 hover:bg-[#111b21] transition">Cari Pesan</button>
                                                    <button onClick={() => { setShowChatMenu(false); setActiveUser(null); setIsMobileView(false); }} className="w-full text-left px-4 py-2 hover:bg-[#111b21] transition text-red-400">Tutup Obrolan</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {rightDrawer === 'search' && (
                                    <div className="bg-[#202c33] p-2 border-b border-[#2a3942] z-20 flex items-center gap-4 animate-in slide-in-from-top-2">
                                        <button onClick={() => { setRightDrawer(null); setSearchQuery(''); }} className="text-[#aebac1] hover:text-white"><ArrowLeft size={20}/></button>
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari pesan di obrolan ini..." autoFocus className="flex-1 bg-[#111b21] text-white px-4 py-1.5 rounded-lg focus:outline-none" />
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto px-[4%] md:px-[8%] py-4 custom-scrollbar flex flex-col gap-1 z-10 relative">
                                    <div className="flex justify-center mb-6 mt-4">
                                        <div className="bg-[#ffeecd] text-[#54421b] text-[12px] px-4 py-2 rounded-lg text-center flex items-center gap-2 shadow-sm font-medium animate-in fade-in duration-500">
                                            <Lock size={14} className="shrink-0" />
                                            <span>Pesan dan panggilan diamankan dengan enkripsi *end-to-end*.</span>
                                        </div>
                                    </div>
                                    
                                    {groupedMessages.map((item, index) => {
                                        if (item.type === 'divider') return <div key={item.id} className="flex justify-center my-3"><div className="bg-[#182229] text-[#8696a0] text-[12.5px] px-3 py-1 rounded-lg uppercase tracking-wide shadow-sm">{item.text}</div></div>;
                                        const msg = item.data;
                                        if (!msg) return null;

                                        const isMe = msg.sender_id === currentUser?.id;
                                        const contentData = parseMessageContent(msg.message);
                                        const prevItem = groupedMessages[index - 1];
                                        const isFirstInGroup = !prevItem || prevItem.type === 'divider' || prevItem.data?.sender_id !== msg.sender_id;

                                        return (
                                            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-1.5' : ''} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                                                <div onContextMenu={(e) => handleContextMenu(e, msg)} className={`relative max-w-[85%] md:max-w-[70%] text-[15px] shadow-sm leading-relaxed group ${isMe ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#202c33] text-[#e9edef]'} ${isMe && isFirstInGroup ? 'rounded-l-lg rounded-br-lg rounded-tr-sm' : ''} ${isMe && !isFirstInGroup ? 'rounded-lg' : ''} ${!isMe && isFirstInGroup ? 'rounded-r-lg rounded-bl-lg rounded-tl-sm' : ''} ${!isMe && !isFirstInGroup ? 'rounded-lg' : ''}`}>
                                                    
                                                    {isFirstInGroup && isMe && <div className="absolute top-0 -right-[8px] w-[8px] h-[13px] text-[#005c4b]"><svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor"><path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path></svg></div>}
                                                    {isFirstInGroup && !isMe && <div className="absolute top-0 -left-[8px] w-[8px] h-[13px] text-[#202c33]"><svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor"><path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" transform="scale(-1, 1) translate(-8, 0)"></path></svg></div>}

                                                    <div onClick={(e) => handleContextMenu(e, msg)} className="absolute top-1 right-1 cursor-pointer bg-gradient-to-l from-[#005c4b] via-[#005c4b] to-transparent pl-4 pr-1 py-0.5 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"><ChevronDown size={18} className="text-white/80 hover:text-white" /></div>

                                                    <div className="flex flex-col min-w-[100px] z-10 relative p-1.5 px-2 py-1">
                                                        {contentData.replyTo && (
                                                            <div className="bg-black/10 rounded-lg p-2 mb-1.5 border-l-4 border-[#00a884] flex flex-col">
                                                                <span className="text-[#00a884] font-medium text-[13px]">{contentData.replyTo.sender || ''}</span>
                                                                <span className="text-white/70 text-[13.5px] truncate max-w-[200px]">{String(contentData.replyTo.text || '')}</span>
                                                            </div>
                                                        )}
                                                        {contentData.text && <span className="pr-[65px] pt-0.5 break-words">{String(contentData.text)}</span>}
                                                        {contentData.type === 'image' && contentData.fileData && <div onClick={() => setViewingImage(contentData.fileData)} className="mt-2 rounded max-h-[320px] overflow-hidden relative group/img cursor-pointer"><img src={contentData.fileData} className="w-full h-full object-cover group-hover/img:brightness-90 transition-all duration-300" alt="Media"/></div>}
                                                        {contentData.type === 'document' && contentData.fileData && <a href={contentData.fileData} download={contentData.fileName} className="flex items-center gap-3 p-3 bg-black/20 rounded-md mt-1 cursor-pointer hover:bg-black/30 transition"><FileText size={24} className="text-white/90"/><div className="flex-1 overflow-hidden"><p className="text-[14px] font-medium truncate">{contentData.fileName}</p></div></a>}
                                                        
                                                        <div className="text-[10.5px] text-white/60 text-right absolute bottom-1 right-2 flex items-center gap-1 font-medium">
                                                            <span>{formatTime(msg.created_at)}</span>
                                                            {isMe && (msg.status === 'read' ? <CheckCheck size={14} className="text-[#53bdeb]"/> : msg.status === 'delivered' ? <CheckCheck size={14} className="text-white/80"/> : <Check size={14} className="text-white/80"/>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {partnerTyping && (
                                        <div className="flex justify-start mt-2 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="bg-[#202c33] rounded-r-lg rounded-bl-lg rounded-tl-sm px-4 py-3 shadow-sm text-[#8696a0] flex gap-1.5 items-center w-fit">
                                                <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} className="h-6" />
                                </div>

                                {replyingTo && (
                                    <div className="bg-[#202c33] px-4 pt-2 -mb-2 z-20 flex animate-in slide-in-from-bottom-2">
                                        <div className="flex-1 bg-[#111b21] rounded-lg p-2 border-l-4 border-[#00a884] flex items-center justify-between shadow-inner">
                                            <div className="flex flex-col text-[13.5px]">
                                                <span className="text-[#00a884] font-medium">{replyingTo.sender_id === currentUser?.id ? 'Anda' : activeUser?.name || 'Kontak'}</span>
                                                <span className="text-[#8696a0] truncate">{String(parseMessageContent(replyingTo.message).text || 'Media')}</span>
                                            </div>
                                            <button onClick={() => setReplyingTo(null)} className="p-2 text-[#8696a0] hover:text-white transition-colors"><X size={20}/></button>
                                        </div>
                                    </div>
                                )}

                                {selectedFile && (
                                    <div className="bg-[#202c33] border-t border-[#2a3942] p-4 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-30 animate-in slide-in-from-bottom-5">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-16 h-16 bg-[#111b21] rounded-xl border border-[#2a3942] flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                                                {selectedFile.type === 'image' ? <img src={selectedFile.dataUrl} alt="preview" className="w-full h-full object-cover" /> : <FileText size={32} className="text-[#00a884]" />}
                                            </div>
                                            <div className="truncate text-sm text-[#e9edef] flex flex-col justify-center">
                                                <p className="font-semibold text-[15px]">{selectedFile.type === 'image' ? 'Kirim Gambar' : 'Kirim Dokumen'}</p>
                                                <p className="truncate text-[#8696a0] text-xs mt-0.5">{selectedFile.name}</p>
                                            </div>
                                        </div>
                                        <button disabled={isSending} onClick={() => setSelectedFile(null)} className="p-3 bg-[#2a3942] hover:bg-red-500/20 rounded-full text-[#8696a0] hover:text-red-400 transition-colors"><X size={20} /></button>
                                    </div>
                                )}

                                <div className="bg-[#202c33] min-h-[62px] px-3 py-2.5 flex items-end gap-2 shrink-0 z-20">
                                    <div className="flex gap-2 text-[#8696a0] items-center pb-2.5 px-2">
                                        <div className="relative" ref={emojiMenuRef}>
                                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-1.5 rounded-full transition-colors ${showEmojiPicker ? 'bg-[#2a3942] text-white' : 'hover:bg-[#2a3942]'}`}><Smile size={26}/></button>
                                            {showEmojiPicker && (
                                                <div className="absolute bottom-16 left-0 bg-[#202c33] border border-[#2a3942] rounded-xl shadow-2xl p-3 w-64 h-64 overflow-y-auto custom-scrollbar z-40 grid grid-cols-6 gap-2 animate-in fade-in slide-in-from-bottom-4">
                                                    {EMOJIS.map((emoji, idx) => (
                                                        <button key={idx} onClick={() => setNewMessage(prev => prev + emoji)} className="text-xl hover:bg-[#2a3942] rounded p-1 transition">{emoji}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative" ref={attachMenuRef}>
                                            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-1.5 rounded-full transition-all duration-300 ${showAttachMenu ? 'bg-[#2a3942] text-white rotate-45' : 'hover:bg-[#2a3942] hover:text-[#d1d7db]'}`}><Paperclip size={24} className="transform transition-transform duration-300"/></button>
                                            {showAttachMenu && (
                                                <div className="absolute bottom-16 left-0 md:-left-4 bg-[#202c33] border border-[#2a3942] rounded-3xl shadow-2xl p-4 grid grid-cols-2 gap-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200 min-w-[280px]">
                                                    <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
                                                    <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx,.xls,.txt" className="hidden" onChange={(e) => handleFileSelect(e, 'document')} />
                                                    <button onClick={() => imageInputRef.current.click()} className="flex flex-col items-center gap-2 hover:bg-[#2a3942] p-3 rounded-2xl transition group"><div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><ImageIcon size={26} className="text-white" fill="white" /></div><span className="font-medium text-[13.5px] text-[#e9edef]">Foto & Video</span></button>
                                                    <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-2 hover:bg-[#2a3942] p-3 rounded-2xl transition group"><div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7F66FF] to-[#A084FF] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><FileText size={26} className="text-white" fill="white" /></div><span className="font-medium text-[13.5px] text-[#e9edef]">Dokumen</span></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-[#2a3942] rounded-xl flex items-center overflow-hidden mb-1 shadow-sm focus-within:border focus-within:border-[#8696a0]/30 transition-all">
                                        <textarea ref={inputRef} value={newMessage} onChange={handleTyping} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} placeholder="Ketik pesan" rows="1" className="w-full bg-transparent text-[#e9edef] px-4 py-3 resize-none focus:outline-none custom-scrollbar text-[15px]" style={{ minHeight: '46px' }} />
                                    </div>
                                    <div className="pb-1 pl-1">
                                        {(newMessage.trim() || selectedFile) ? (
                                            <button disabled={isSending} onClick={handleSendMessage} className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isSending ? 'bg-[#029072] opacity-70 cursor-wait' : 'bg-[#00a884] hover:bg-[#029072] hover:scale-105 active:scale-95 text-[#111b21]'}`}>{isSending ? <Loader className="animate-spin w-6 h-6 text-[#111b21]"/> : <Send size={24} className="ml-1" fill="currentColor"/>}</button>
                                        ) : (
                                            <button className="w-[48px] h-[48px] bg-transparent text-[#8696a0] hover:bg-[#2a3942] rounded-full flex items-center justify-center transition-colors"><Mic size={24} fill="currentColor"/></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10 bg-[#202c33]">
                                <img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669aeJeom.png" alt="WhatsApp" className="w-[320px] opacity-90 mb-10 drop-shadow-xl animate-in zoom-in-95 duration-700 pointer-events-none" />
                                <h2 className="text-[32px] font-light text-[#e9edef] mb-4 tracking-wide">RamaChat Web Ultimate</h2>
                                <p className="text-[#8696a0] mt-2 max-w-[460px] text-[14.5px] leading-relaxed">
                                    Kirim dan terima pesan tanpa perlu menghubungkan telepon Anda ke internet.<br/>
                                    Dilengkapi Panggilan Video, Tambah Kontak, Hapus Pesan, dan Emoji!
                                </p>
                                <div className="absolute bottom-10 flex items-center gap-2 text-[#8696a0] text-[13px] font-medium tracking-wide opacity-80">
                                    <Lock size={12}/> <span>Dienkripsi *End-to-End*</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
                textarea.custom-scrollbar::-webkit-scrollbar { width: 4px; }
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
