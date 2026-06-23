import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Search, MoreHorizontal, Paperclip, Smile, X, Download, MessageSquare, Trash2, Pin, Check, CheckCheck, BookOpen, GraduationCap, Users, ArrowLeft } from "lucide-react";
import { messagingApi, chatAccessApi, courseChatApi, programmeChatApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { getReverbConfig } from "../lib/reverb";


let echo: Echo<"reverb"> | null = null;
function getEcho(): Echo<"reverb"> | null {
  if (echo) return echo;
  const cfg = getReverbConfig();
  if (!cfg.key) return null;
  (window as unknown as Record<string, unknown>).Pusher = Pusher;
  echo = new Echo({
    broadcaster: "reverb",
    key:         cfg.key,
    wsHost:      cfg.wsHost,
    wsPort:      cfg.wsPort,
    wssPort:     cfg.wsPort,
    forceTLS:    cfg.forceTLS,
    enabledTransports: cfg.enabledTransports,
    authEndpoint: `${import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:8000'}/api/broadcasting/auth`,
    auth: { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` } },
  } as ConstructorParameters<typeof Echo>[0]);
  return echo;
}

type ChatType = 'direct' | 'course' | 'programme';

interface ApiConversation {
  id: string;
  type: ChatType;
  participant_name?: string;
  participant_role?: string;
  participant_user_id?: string;
  owner_user_id?: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  course_id?: string | null;
  programme_id?: string | null;
  title?: string;
  is_moderated?: boolean;
}

interface ApiMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string | null;
  timestamp: string;
  read: boolean;
  reactions: Record<string, string[]> | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  deleted_at?: string | null;
  deletion_type?: 'me' | 'everyone';
  is_pinned?: boolean;
  message_type?: 'text' | 'question' | 'announcement' | 'resource';
}

interface TypingUser {
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

interface Course {
  id: string;
  name: string;
  short_name?: string;
  instructor_name?: string;
}

interface Programme {
  id: string;
  name: string;
  code?: string;
}


export function Chat() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ChatType>(
    () => (sessionStorage.getItem('chat_active_tab') as ChatType) ?? 'direct'
  );
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    () => sessionStorage.getItem('chat_selected_conv_id')
  );
  const [messages, setMessages]   = useState<ApiMessage[]>([]);
  const [input, setInput]         = useState("");
  const [searchConvo, setSearchConvo] = useState("");
  const [sending, setSending]     = useState(false);
  const [filePreview, setFilePreview] = useState<File | null>(null);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sent' | 'delivered' | 'read'>>({});
  const [pinnedMessages, setPinnedMessages] = useState<ApiMessage[]>([]);
  const [showPinned, setShowPinned] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<string | null>(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [conversationParticipantIds, setConversationParticipantIds] = useState<Set<string>>(new Set());
  
  // New message modal for direct chats
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [eligibleRecipients, setEligibleRecipients] = useState<{id: string; name: string; role: string}[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [creatingConversation, setCreatingConversation] = useState(false);
  
  // Mobile sidebar visibility
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Hide sidebar on mobile when conversation selected
  useEffect(() => {
    if (selectedConvId && window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }, [selectedConvId]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSentTypingRef = useRef(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputEmojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiClickGuardRef = useRef(false);
  const selectedConvIdRef = useRef<string | null>(selectedConvId);

  // Keep ref in sync with state (used inside WS closures to avoid stale captures)
  useEffect(() => { selectedConvIdRef.current = selectedConvId; }, [selectedConvId]);

  // Persist active tab and selected conversation across page refreshes
  useEffect(() => { sessionStorage.setItem('chat_active_tab', activeTab); }, [activeTab]);
  useEffect(() => {
    if (selectedConvId) sessionStorage.setItem('chat_selected_conv_id', selectedConvId);
    else sessionStorage.removeItem('chat_selected_conv_id');
  }, [selectedConvId]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  // Load conversation list based on active tab
  useEffect(() => {
    setConversations([]); // clear stale items immediately
    chatAccessApi.myChats().then((res) => {
      const data = res.data?.data ?? {};
      let convs: ApiConversation[] = [];
      if (activeTab === 'direct') {
        convs = data.direct ?? [];
      } else if (activeTab === 'course') {
        convs = data.courses ?? [];
      } else if (activeTab === 'programme') {
        convs = data.programmes ?? [];
      }
      setConversations(convs);
    });
  }, [activeTab]);

  // Load available courses and programmes (role-aware: students get enrolled courses + own programme)
  useEffect(() => {
    chatAccessApi.availableCourses().then((res) => {
      setCourses(res.data?.data ?? []);
    }).catch(() => {});
    chatAccessApi.availableProgrammes().then((res) => {
      setProgrammes(res.data?.data ?? []);
    }).catch(() => {});
  }, []);

  // Load eligible recipients for direct chat
  useEffect(() => {
    if (activeTab === 'direct') {
      chatAccessApi.eligibleRecipients().then((res) => {
        setEligibleRecipients(res.data?.data ?? []);
      });
    }
  }, [activeTab]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Load messages for a conversation
  const loadMessages = (convId: string) => {
    messagingApi.messages(convId).then((res) => {
      setMessages(res.data.data ?? res.data ?? []);
    });
    // Reset unread count when opening a conversation
    messagingApi.markRead(convId).catch(() => {});
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, unread_count: 0 } : c));
    messagingApi.pinnedMessages(convId).then((res) => {
      setPinnedMessages(res.data?.data ?? []);
    });
  };

  // Subscribe Reverb channel when conversation changes
  useEffect(() => {
    if (!selectedConvId) return;

    // Load messages and pinned messages
    loadMessages(selectedConvId);

    const echoInst = getEcho();
    if (!echoInst) return;
    const ch = echoInst.private(`conversation.${selectedConvId}`);

    ch.listen(".message.sent", (data: ApiMessage) => {
      // Skip own messages — handleSend already added them optimistically
      if (data.sender_id !== user?.id) {
        setMessages((prev) => [...prev, data]);
        messagingApi.markDelivered(data.id);
      }
    });

    ch.listen(".reaction.added", (data: { message_id: string; reactions: Record<string, string[]> }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message_id ? { ...m, reactions: data.reactions } : m))
      );
    });

    // Typing indicators
    ch.listen(".user.typing", (data: TypingUser) => {
      if (data.user_id !== user?.id) {
        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.user_id !== data.user_id);
          return data.is_typing ? [...filtered, data] : filtered;
        });
      }
    });

    // Message delivery status
    ch.listen(".message.status", (data: { message_id: string; user_id: string; status: 'delivered' | 'read' }) => {
      if (data.user_id !== user?.id) {
        setMessageStatuses((prev) => ({ ...prev, [data.message_id]: data.status }));
      }
    });

    // Message deleted
    ch.listen(".message.deleted", (data: { message_id: string; deletion_type: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message_id ? { ...m, deleted_at: new Date().toISOString(), content: null } : m))
      );
    });

    // Message pinned
    ch.listen(".message.pinned", (data: { message_id: string; is_pinned: boolean }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message_id ? { ...m, is_pinned: data.is_pinned } : m))
      );
      // Refresh pinned messages
      messagingApi.pinnedMessages(selectedConvId).then((res) => {
        setPinnedMessages(res.data?.data ?? []);
      });
    });

    return () => { getEcho()?.leave(`conversation.${selectedConvId}`); };
  }, [selectedConvId, user?.id]);

  // Fetch participants for group chats (for online count)
  useEffect(() => {
    if (!selectedConv) { setConversationParticipantIds(new Set()); return; }
    if (selectedConv.type === 'course' && selectedConv.course_id) {
      courseChatApi.participants(selectedConv.course_id).then((res) => {
        const ids = new Set<string>((res.data?.data ?? []).map((p: { user_id: string }) => p.user_id));
        setConversationParticipantIds(ids);
      }).catch(() => {});
    } else if (selectedConv.type === 'programme' && selectedConv.programme_id) {
      programmeChatApi.participants(selectedConv.programme_id).then((res) => {
        const ids = new Set<string>((res.data?.data ?? []).map((p: { user_id: string }) => p.user_id));
        setConversationParticipantIds(ids);
      }).catch(() => {});
    } else {
      setConversationParticipantIds(new Set());
    }
  }, [selectedConvId]);

  // Polling fallback: refresh active messages when WebSocket is unavailable
  useEffect(() => {
    if (!selectedConvId || getEcho()) return;
    const id = setInterval(() => {
      messagingApi.messages(selectedConvId).then((res) => {
        const fetched: ApiMessage[] = res.data.data ?? res.data ?? [];
        setMessages((prev) => (fetched.length !== prev.length ? fetched : prev));
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [selectedConvId]);

  // Polling fallback: refresh conversation list when WebSocket is unavailable
  useEffect(() => {
    if (getEcho()) return;
    const id = setInterval(() => {
      chatAccessApi.myChats().then((res) => {
        const data = res.data?.data ?? {};
        const convs: ApiConversation[] =
          activeTab === 'direct' ? (data.direct ?? []) :
          activeTab === 'course' ? (data.courses ?? []) :
          (data.programmes ?? []);
        setConversations(convs);
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [activeTab]);

  // Presence channel for online/offline status
  useEffect(() => {
    if (!user) return;
    const echoPresence = getEcho();
    if (!echoPresence) return;
    const p = echoPresence.join("online-users") as unknown as {
      here:    (fn: (members: { id: string }[]) => void) => any;
      joining: (fn: (member: { id: string })  => void)   => any;
      leaving: (fn: (member: { id: string })  => void)   => any;
    };
    p.here((ms: { id: string }[]) => setOnlineUsers(new Set(ms.map((m) => m.id))))
     .joining((m: { id: string }) => setOnlineUsers((prev) => new Set([...prev, m.id])))
     .leaving((m: { id: string }) => setOnlineUsers((prev) => { const s = new Set(prev); s.delete(m.id); return s; }));
    return () => { getEcho()?.leave("online-users"); };
  }, [user]);

  // Listen for new messages on all conversations to update conversation list
  useEffect(() => {
    if (conversations.length === 0) return;
    
    conversations.forEach((conv) => {
      const echoConv = getEcho();
      if (!echoConv) return;
      const ch = echoConv.private(`conversation.${conv.id}`);
      
      ch.listen(".message.sent", (data: ApiMessage) => {
        // Update conversation with new message info
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv.id
              ? ({
                  ...c,
                  last_message: data.content ?? "📎 Attachment",
                  last_message_time: data.timestamp,
                  // Only increment if the message is from someone else AND this conv is not currently open
                  unread_count: (data.sender_id !== user?.id && conv.id !== selectedConvIdRef.current)
                    ? c.unread_count + 1
                    : c.id === selectedConvIdRef.current ? 0 : c.unread_count,
                } as ApiConversation)
              : c
          )
        );
      });
    });
  }, [conversations.length, user?.id]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !filePreview) || !selectedConvId || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (input.trim()) fd.append("content", input.trim());
      if (filePreview) fd.append("attachment", filePreview);
      const res = await messagingApi.sendMessage(selectedConvId, fd);
      const msg: ApiMessage = res.data.data ?? res.data;
      setMessages((prev) => [...prev, msg]);
      // Sender always has 0 unread in the conversation they just sent to
      setConversations((prev) => prev.map((c) => c.id === selectedConvId ? { ...c, unread_count: 0 } : c));
      setInput("");
      setFilePreview(null);
    } finally {
      setSending(false);
    }
  }, [input, filePreview, selectedConvId, sending]);

  const handleReact = async (messageId: string, emoji: string) => {
    if (!selectedConvId) return;
    setReactionTarget(null);
    setShowEmojiPicker(false);
    setEmojiPickerMessageId(null);
    const res = await messagingApi.react(messageId, emoji);
    const updated = res.data.data;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reactions: updated.reactions } : m))
    );
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (emojiClickGuardRef.current || !emojiPickerMessageId) return;
    emojiClickGuardRef.current = true;
    handleReact(emojiPickerMessageId, emojiData.emoji);
    setTimeout(() => { emojiClickGuardRef.current = false; }, 300);
  };

  const handleInputEmojiClick = (emojiData: EmojiClickData) => {
    if (emojiClickGuardRef.current) return;
    emojiClickGuardRef.current = true;
    setInput((prev) => prev + emojiData.emoji);
    setShowInputEmojiPicker(false);
    setTimeout(() => { emojiClickGuardRef.current = false; }, 300);
  };

  const toggleEmojiPicker = (messageId: string) => {
    if (showEmojiPicker && emojiPickerMessageId === messageId) {
      setShowEmojiPicker(false);
      setEmojiPickerMessageId(null);
    } else {
      setShowEmojiPicker(true);
      setEmojiPickerMessageId(messageId);
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setEmojiPickerMessageId(null);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Close input emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputEmojiPickerRef.current && !inputEmojiPickerRef.current.contains(event.target as Node)) {
        setShowInputEmojiPicker(false);
      }
    };
    if (showInputEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInputEmojiPicker]);

  // Typing indicator handler
  const handleInputChange = (value: string) => {
    setInput(value);
    if (!selectedConvId || !value.trim()) return;

    // Send typing start if not already sent
    if (!hasSentTypingRef.current) {
      hasSentTypingRef.current = true;
      messagingApi.typing(selectedConvId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      hasSentTypingRef.current = false;
      messagingApi.typing(selectedConvId, false);
    }, 2000);
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId: string, deletionType: 'me' | 'everyone') => {
    try {
      await messagingApi.deleteMessage(messageId, deletionType);
      if (deletionType === 'everyone') {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, deleted_at: new Date().toISOString(), content: null } : m))
        );
      }
      setContextMenu(null);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Pin message handler
  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    try {
      await messagingApi.pinMessage(messageId, isPinned);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_pinned: isPinned } : m))
      );
      // Refresh pinned messages
      if (selectedConvId) {
        const res = await messagingApi.pinnedMessages(selectedConvId);
        setPinnedMessages(res.data?.data ?? []);
      }
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  };

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  // Close context menu
  const closeContextMenu = () => setContextMenu(null);

  // Mark messages as read when viewing
  const markMessagesRead = useCallback(async () => {
    if (!selectedConvId) return;
    const unreadMessages = messages.filter((m) => m.sender_id !== user?.id && !m.read);
    for (const msg of unreadMessages) {
      await messagingApi.markMessageRead(msg.id);
    }
  }, [messages, selectedConvId, user?.id]);

  // Mark read on conversation open
  useEffect(() => {
    markMessagesRead();
  }, [markMessagesRead]);

  const isOnline = (id: string) => onlineUsers.has(id);

  // Returns the ID of the other person in a direct conversation
  const getOtherUserId = (convo: ApiConversation): string => {
    if (user?.id && convo.owner_user_id === user.id) {
      return convo.participant_user_id ?? '';
    }
    return convo.owner_user_id ?? '';
  };

  const onlineParticipantCount = [...conversationParticipantIds].filter((id) => onlineUsers.has(id)).length;

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const filteredConvos = conversations.filter(
    (c) =>
      // Only show direct-type (or legacy null-type) conversations in the direct tab
      (c.type === 'direct' || !c.type) &&
      (
        (c.participant_name ?? c.title ?? "").toLowerCase().includes(searchConvo.toLowerCase()) ||
        (c.participant_role ?? "").toLowerCase().includes(searchConvo.toLowerCase())
      )
  );

  // Filter courses/programmes based on search
  const filteredCourses = courses.filter(
    (c) => c.name.toLowerCase().includes(searchConvo.toLowerCase())
  );
  const filteredProgrammes = programmes.filter(
    (p) => p.name.toLowerCase().includes(searchConvo.toLowerCase())
  );

  // Get conversation display name based on type
  const getConversationName = (convo: ApiConversation) => {
    if (convo.type === 'course' || convo.type === 'programme') {
      return convo.title ?? convo.participant_name;
    }
    return convo.participant_name;
  };

  // Handle clicking a course - get or create conversation
  const handleCourseClick = async (course: Course) => {
    const existing = conversations.find((c) => c.course_id === course.id && c.type === 'course');
    if (existing) {
      setSelectedConvId(existing.id);
      if (window.innerWidth < 768) setShowSidebar(false);
      return;
    }
    
    try {
      const res = await courseChatApi.getOrCreate(course.id);
      const newConvo: ApiConversation = res.data?.data;
      if (newConvo) {
        setConversations((prev) => [...prev, newConvo]);
        setSelectedConvId(newConvo.id);
        if (window.innerWidth < 768) setShowSidebar(false);
      }
    } catch (err) {
      console.error('Failed to enter course chat:', err);
    }
  };

  // Handle clicking a programme - get or create conversation
  const handleProgrammeClick = async (programme: Programme) => {
    const existing = conversations.find((c) => c.programme_id === programme.id && c.type === 'programme');
    if (existing) {
      setSelectedConvId(existing.id);
      if (window.innerWidth < 768) setShowSidebar(false);
      return;
    }
    
    try {
      const res = await programmeChatApi.getOrCreate(programme.id);
      const newConvo: ApiConversation = res.data?.data;
      if (newConvo) {
        setConversations((prev) => [...prev, newConvo]);
        setSelectedConvId(newConvo.id);
        if (window.innerWidth < 768) setShowSidebar(false);
      }
    } catch (err) {
      console.error('Failed to enter programme chat:', err);
    }
  };

  // Start new direct conversation
  const handleStartDirectChat = async () => {
    if (!selectedRecipient || !newMessageText.trim()) return;

    setCreatingConversation(true);
    try {
      const res = await messagingApi.createConv({
        recipient_id: selectedRecipient,
        message: newMessageText.trim()
      });
      const newConvo = res.data?.data;
      if (newConvo) {
        setConversations((prev) => [newConvo, ...prev]);
        setSelectedConvId(newConvo.id);
        setShowNewMessageModal(false);
        setSelectedRecipient(null);
        setNewMessageText("");
        if (window.innerWidth < 768) setShowSidebar(false);
      }
    } catch (err: unknown) {
      // Handle 409 - conversation already exists
      const axiosErr = err as { response?: { status: number; data?: { conversation?: { id: string } } } };
      if (axiosErr.response?.status === 409) {
        // Backend should return the existing conversation
        const existingConv = axiosErr.response.data?.conversation;
        if (existingConv?.id) {
          // Merge into local list if not already present
          setConversations((prev) =>
            prev.find((c) => c.id === existingConv.id) ? prev : [existingConv as ApiConversation, ...prev]
          );
          setSelectedConvId(existingConv.id);
          setShowNewMessageModal(false);
          setSelectedRecipient(null);
          setNewMessageText("");
          if (window.innerWidth < 768) setShowSidebar(false);
          // Reload messages for this conversation
          loadMessages(existingConv.id);
        } else {
          // Fallback: reload conversations and find by participant
          const res = await chatAccessApi.myChats();
          const directList: ApiConversation[] = res.data?.data?.direct ?? [];
          setConversations(directList);
          const existing = directList.find((c: ApiConversation) =>
            c.type === 'direct' &&
            (c.participant_user_id === selectedRecipient || c.owner_user_id === selectedRecipient)
          );
          if (existing) {
            setSelectedConvId(existing.id);
            setShowNewMessageModal(false);
            setSelectedRecipient(null);
            setNewMessageText("");
            if (window.innerWidth < 768) setShowSidebar(false);
            loadMessages(existing.id);
          }
        }
      } else {
        console.error('Failed to create conversation:', err);
      }
    } finally {
      setCreatingConversation(false);
    }
  };

  // Get conversation icon based on type
  const getConversationIcon = (type?: ChatType) => {
    switch (type) {
      case 'course': return <BookOpen size={14} className="text-blue-500" />;
      case 'programme': return <GraduationCap size={14} className="text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden flex relative" style={{ height: "calc(100vh - 140px)", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      {/* Sidebar - Hidden on mobile when conversation selected */}
      <div 
        className={`
          flex-shrink-0 flex flex-col border-r absolute md:relative z-10 bg-white w-full md:w-80
          transition-transform duration-300 ease-in-out
          ${!showSidebar ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        `} 
        style={{ borderColor: "#f1f5f9", height: "100%" }}
      >
        <div className="p-4 border-b" style={{ borderColor: "#f1f5f9" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Messages</h2>

          {/* Chat Type Tabs - Icons inline with text */}
          <div className="flex gap-1 mb-3 p-1 rounded-lg" style={{ backgroundColor: "#f1f5f9" }}>
            {(['direct', 'course', 'programme'] as ChatType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedConvId(null); }}
                className="flex-1 py-1.5 px-1 sm:px-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1"
                style={{
                  backgroundColor: activeTab === tab ? "white" : "transparent",
                  color: activeTab === tab ? "#2563eb" : "#64748b",
                  boxShadow: activeTab === tab ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {tab === 'direct' && <Users size={12} />}
                {tab === 'course' && <BookOpen size={12} />}
                {tab === 'programme' && <GraduationCap size={12} />}
                <span className="hidden sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                <span className="sm:hidden">{tab.charAt(0).toUpperCase()}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Search conversations..." value={searchConvo}
              onChange={(e) => setSearchConvo(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              style={{ fontSize: "12px", borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* DIRECT TAB: New Message button + existing conversations */}
          {activeTab === 'direct' && (
            <>
              <div className="p-3">
                <button
                  onClick={() => setShowNewMessageModal(true)}
                  className="w-full py-2 px-3 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare size={14} />
                  New Message
                </button>
              </div>
              {filteredConvos.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <MessageSquare size={32} className="mb-2 opacity-40" />
                  <p style={{ fontSize: "13px" }}>No direct messages yet</p>
                  <p style={{ fontSize: "11px" }}>Click "New Message" to start</p>
                </div>
              )}
            </>
          )}
          
          {/* COURSE TAB: Available courses */}
          {activeTab === 'course' && (
            <>
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-slate-500 mb-2">Your Courses</p>
              </div>
              {filteredCourses.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <BookOpen size={32} className="mb-2 opacity-40" />
                  <p style={{ fontSize: "13px" }}>No courses found</p>
                </div>
              )}
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-slate-50"
                  style={{ backgroundColor: selectedConv?.course_id === course.id ? "#eff6ff" : "transparent" }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                    <BookOpen size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }} className="truncate">{course.name}</p>
                    <p style={{ fontSize: "11px", color: "#94a3b8" }}>{course.instructor_name || 'Course Chat'}</p>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* PROGRAMME TAB: Available programmes */}
          {activeTab === 'programme' && (
            <>
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-slate-500 mb-2">Your Programme</p>
              </div>
              {filteredProgrammes.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <GraduationCap size={32} className="mb-2 opacity-40" />
                  <p style={{ fontSize: "13px" }}>No programme found</p>
                </div>
              )}
              {filteredProgrammes.map((programme) => (
                <div
                  key={programme.id}
                  onClick={() => handleProgrammeClick(programme)}
                  className="flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-slate-50"
                  style={{ backgroundColor: selectedConv?.programme_id === programme.id ? "#eff6ff" : "transparent" }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white flex items-center justify-center text-sm font-bold">
                    <GraduationCap size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }} className="truncate">{programme.name}</p>
                    <p style={{ fontSize: "11px", color: "#94a3b8" }}>{programme.code || 'Programme Chat'}</p>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* DIRECT CONVERSATIONS LIST */}
          {activeTab === 'direct' && filteredConvos.map((convo) => {
            const online = isOnline(getOtherUserId(convo));
            const isGroupChat = convo.type === 'course' || convo.type === 'programme';
            return (
              <div key={convo.id}
                onClick={() => {
                  setSelectedConvId(convo.id);
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                className="flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-slate-50"
                style={{ backgroundColor: selectedConvId === convo.id ? "#eff6ff" : "transparent" }}>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                    {isGroupChat ? (convo.type === 'course' ? <BookOpen size={16} /> : <GraduationCap size={16} />) : initials(convo.participant_name ?? "")}
                  </div>
                  {!isGroupChat && online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: "#22c55e" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {getConversationIcon(convo.type)}
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{getConversationName(convo)}</p>
                    </div>
                    <p style={{ fontSize: "10px", color: "#94a3b8" }}>{convo.last_message_time ?? ""}</p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="truncate" style={{ fontSize: "11px", color: "#94a3b8", maxWidth: "160px" }}>
                      {convo.last_message ?? ""}
                    </p>
                    {convo.unread_count > 0 && (
                      <span className="flex-shrink-0 text-white rounded-full flex items-center justify-center ml-2"
                        style={{ fontSize: "10px", fontWeight: 700, width: "18px", height: "18px", backgroundColor: "#2563eb" }}>
                        {convo.unread_count}
                      </span>
                    )}
                  </div>
                  {!isGroupChat && <span style={{ fontSize: "10px", color: "#94a3b8" }}>{convo.participant_role}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col w-full">
        {selectedConv ? (
          <>
            {/* Header - With back button on mobile */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-3.5 border-b" style={{ borderColor: "#f1f5f9" }}>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Back button - only on mobile */}
                <button
                  onClick={() => {
                    setSelectedConvId(null);
                    setShowSidebar(true);
                  }}
                  className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                    {(selectedConv.type === 'course' || selectedConv.type === 'programme')
                      ? (selectedConv.type === 'course' ? <BookOpen size={16} /> : <GraduationCap size={16} />)
                      : initials(getConversationName(selectedConv) ?? "")}
                  </div>
                  {(selectedConv.type === 'direct' || !selectedConv.type) && isOnline(getOtherUserId(selectedConv)) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: "#22c55e" }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate" style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{getConversationName(selectedConv)}</p>
                  <p className="truncate" style={{ fontSize: "11px", color: ((selectedConv.type === 'direct' || !selectedConv.type) && isOnline(getOtherUserId(selectedConv))) || (selectedConv.type === 'course' || selectedConv.type === 'programme' ? onlineParticipantCount > 0 : false) ? "#22c55e" : "#94a3b8", fontWeight: ((selectedConv.type === 'direct' || !selectedConv.type) && isOnline(getOtherUserId(selectedConv))) || (selectedConv.type === 'course' || selectedConv.type === 'programme' ? onlineParticipantCount > 0 : false) ? 500 : 400 }}>
                    {(selectedConv.type === 'direct' || !selectedConv.type)
                      ? (isOnline(getOtherUserId(selectedConv)) ? "● Online" : (selectedConv.participant_role ? `${selectedConv.participant_role.charAt(0).toUpperCase() + selectedConv.participant_role.slice(1)} · Direct` : 'Direct'))
                      : (onlineParticipantCount > 0 ? `● ${onlineParticipantCount} online` : (selectedConv.type === 'course' ? 'Course Chat' : 'Programme Chat'))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pinnedMessages.length > 0 && (
                  <button
                    onClick={() => setShowPinned(!showPinned)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: showPinned ? "#dbeafe" : "#f1f5f9", color: showPinned ? "#2563eb" : "#64748b" }}
                  >
                    <Pin size={12} />
                    {pinnedMessages.length} pinned
                  </button>
                )}
                <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                  <MoreHorizontal size={17} />
                </button>
              </div>
            </div>

            {/* Pinned Messages Banner */}
            {showPinned && pinnedMessages.length > 0 && (
              <div className="px-4 py-2 border-b" style={{ borderColor: "#f1f5f9", backgroundColor: "#eff6ff" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Pin size={12} className="text-blue-500" />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb" }}>Pinned Messages</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {pinnedMessages.map((msg) => (
                    <div key={msg.id} className="text-xs p-2 rounded-lg" style={{ backgroundColor: "white" }}>
                      <span className="font-medium" style={{ color: "#1e293b" }}>{msg.sender_name}:</span>{' '}
                      <span style={{ color: "#64748b" }}>{msg.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4" style={{ backgroundColor: "#f8fafc" }}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p style={{ fontSize: "13px" }}>No messages yet. Say hello!</p>
                </div>
              ) : messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                const isDeleted = msg.deleted_at != null;
                const status = messageStatuses[msg.id];
                const canDeleteEveryone = isOwn && !isDeleted && new Date(msg.timestamp).getTime() > Date.now() - 10 * 60 * 1000; // 10 min window

                return (
                  <div key={msg.id} className={`flex group ${isOwn ? "justify-end" : "justify-start"}`}>
                    {!isOwn && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold mr-2 mt-auto flex-shrink-0">
                        {initials(msg.sender_name)}
                      </div>
                    )}
                    <div className={`relative flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"} max-w-[75%] sm:max-w-xs lg:max-w-md`}>
                      <div
                        onContextMenu={(e) => handleContextMenu(e, msg.id)}
                        className={`relative ${isDeleted ? 'opacity-60' : ''}`}
                        style={{
                          backgroundColor: isDeleted ? "#f1f5f9" : (isOwn ? "#2563eb" : "white"),
                          color: isDeleted ? "#94a3b8" : (isOwn ? "white" : "#1e293b"),
                          borderRadius: "16px",
                          borderBottomRightRadius: isOwn ? "4px" : "16px",
                          borderBottomLeftRadius: isOwn ? "16px" : "4px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          padding: "10px 16px",
                        }}>
                        {/* Pin indicator */}
                        {msg.is_pinned && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fbbf24" }}>
                            <Pin size={8} className="text-white" />
                          </div>
                        )}

                        {isDeleted ? (
                          <span className="italic">This message was deleted</span>
                        ) : (
                          <>
                            {msg.content && <span>{msg.content}</span>}
                            {msg.attachment_path && (
                              <div className="mt-2 flex items-center gap-2 text-xs rounded-lg px-2 py-1.5"
                                style={{ backgroundColor: isOwn ? "rgba(255,255,255,0.15)" : "#f1f5f9" }}>
                                <Paperclip size={11} className="flex-shrink-0" />
                                <span className="truncate max-w-[130px]">{msg.attachment_name}</span>
                                <a href={`${import.meta.env.VITE_API_URL?.replace("/api/v1", "")}/storage/${msg.attachment_path}`}
                                  target="_blank" rel="noreferrer" className="ml-auto flex-shrink-0">
                                  <Download size={11} />
                                </a>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex items-center gap-1 mt-1" style={{ justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                          <p style={{ fontSize: "10px", opacity: 0.7 }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {/* Delivery status for own messages */}
                          {isOwn && !isDeleted && (
                            <span style={{ fontSize: "10px", opacity: 0.7 }}>
                              {status === 'read' ? <CheckCheck size={10} /> : status === 'delivered' ? <Check size={10} /> : '•'}
                            </span>
                          )}
                        </div>
                        {/* Reaction button on hover - only for non-deleted messages */}
                        {!isDeleted && (
                          <button onClick={(e) => {
                              e.stopPropagation();
                              toggleEmojiPicker(msg.id);
                            }}
                            className="absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-sm"
                            style={isOwn ? { left: "-28px" } : { right: "-28px" }}>
                            <Smile size={11} className="text-slate-400" />
                          </button>
                        )}
                      </div>

                      {/* Emoji picker */}
                      {!isDeleted && showEmojiPicker && emojiPickerMessageId === msg.id && (
                        <div ref={emojiPickerRef} className={`absolute z-50 ${isOwn ? 'right-0' : 'left-0'}`} style={{ bottom: '100%', marginBottom: '8px' }} onClick={(e) => e.stopPropagation()}>
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme={Theme.LIGHT}
                            width={280}
                            height={350}
                            searchPlaceholder="Search emoji..."
                            skinTonesDisabled
                          />
                        </div>
                      )}

                      {/* Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(msg.reactions).map(([emoji, users]) =>
                            users.length > 0 ? (
                              <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors"
                                style={{
                                  backgroundColor: users.includes(user?.id ?? "") ? "#dbeafe" : "#f1f5f9",
                                  borderColor:     users.includes(user?.id ?? "") ? "#93c5fd"  : "#e2e8f0",
                                  color: "#1e293b",
                                }}>
                                {emoji} <span>{users.length}</span>
                              </button>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Context Menu */}
            {contextMenu && (
              <div
                className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[150px]"
                style={{ borderColor: "#e2e8f0", left: contextMenu.x, top: contextMenu.y }}
                onClick={closeContextMenu}
              >
                {(() => {
                  const msg = messages.find((m) => m.id === contextMenu.messageId);
                  if (!msg) return null;
                  const isOwn = msg.sender_id === user?.id;
                  const isDeleted = msg.deleted_at != null;
                  const canDeleteEveryone = isOwn && !isDeleted && new Date(msg.timestamp).getTime() > Date.now() - 10 * 60 * 1000;

                  return (
                    <>
                      {!isDeleted && (
                        <>
                          <button
                            onClick={() => handlePinMessage(msg.id, !msg.is_pinned)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Pin size={14} />
                            {msg.is_pinned ? 'Unpin Message' : 'Pin Message'}
                          </button>
                          <div className="border-t my-1" style={{ borderColor: "#e2e8f0" }} />
                          <button
                            onClick={() => handleDeleteMessage(msg.id, 'me')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 text-slate-600 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete for Me
                          </button>
                          {canDeleteEveryone && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id, 'everyone')}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 text-red-500 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete for Everyone
                            </button>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Typing Indicator — positioned just above input */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: "#f8fafc" }}>
                <div className="flex items-end gap-1 h-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p style={{ fontSize: "12px", color: "#64748b" }}>
                  {typingUsers.map((u) => u.user_name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                </p>
              </div>
            )}

            {/* File preview */}
            {filePreview && (
              <div className="px-4 py-2 border-t flex items-center gap-2 text-sm"
                style={{ borderColor: "#f1f5f9", backgroundColor: "#f8fafc", color: "#64748b" }}>
                <Paperclip size={13} className="text-blue-500 flex-shrink-0" />
                <span className="truncate flex-1">{filePreview.name}</span>
                <button onClick={() => setFilePreview(null)} className="text-slate-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-2 sm:p-4 border-t relative" style={{ borderColor: "#f1f5f9" }}>
              {showInputEmojiPicker && (
                <div ref={inputEmojiPickerRef} className="absolute z-50 bottom-full mb-2 left-0 right-0 sm:left-auto sm:right-0 flex justify-center sm:block" onClick={(e) => e.stopPropagation()}>
                  <EmojiPicker
                    onEmojiClick={handleInputEmojiClick}
                    theme={Theme.LIGHT}
                    width={Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 16 : 300)}
                    height={320}
                    searchPlaceholder="Search emoji..."
                    skinTonesDisabled
                  />
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-2xl border px-3 sm:px-4 py-2" style={{ borderColor: "#e2e8f0" }}>
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={(e) => setFilePreview(e.target.files?.[0] ?? null)} />
                <button onClick={() => fileInputRef.current?.click()}
                  className="text-slate-400 hover:text-blue-500 transition-colors flex-shrink-0">
                  <Paperclip size={17} />
                </button>
                <input
                  type="text" placeholder="Type a message..." value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 focus:outline-none text-slate-700 bg-transparent min-w-0"
                  style={{ fontSize: "13px" }} />
                <button onClick={() => setShowInputEmojiPicker((prev) => !prev)}
                  className="text-slate-400 hover:text-yellow-500 transition-colors flex-shrink-0"
                  title="Add emoji to message">
                  <Smile size={17} />
                </button>
                <button onClick={handleSend} disabled={(!input.trim() && !filePreview) || sending}
                  className="p-2 rounded-xl text-white transition-all flex-shrink-0"
                  style={{ backgroundColor: (input.trim() || filePreview) && !sending ? "#2563eb" : "#cbd5e1" }}>
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
            <MessageSquare size={48} className="text-slate-200 mb-3" />
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#94a3b8" }}>Select a conversation</p>
            <p style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>Choose one from the left panel</p>
          </div>
        )}
      </div>

      {/* New Message Modal for Direct Chats */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-96 max-w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#f1f5f9" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>New Message</h3>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setSelectedRecipient(null);
                  setNewMessageText("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Recipient Select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">To:</label>
                <select
                  value={selectedRecipient || ""}
                  onChange={(e) => setSelectedRecipient(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ fontSize: "13px", borderColor: "#e2e8f0" }}
                >
                  <option value="">Select a recipient...</option>
                  {eligibleRecipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name} ({recipient.role})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message:</label>
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type your first message..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  style={{ fontSize: "13px", borderColor: "#e2e8f0" }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: "#f1f5f9" }}>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setSelectedRecipient(null);
                  setNewMessageText("");
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDirectChat}
                disabled={!selectedRecipient || !newMessageText.trim() || creatingConversation}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingConversation ? "Starting..." : "Start Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}