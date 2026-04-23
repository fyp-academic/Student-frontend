import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Search, MoreHorizontal, Paperclip, Smile, X, Download, MessageSquare } from "lucide-react";
import { messagingApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

let echo: Echo<"reverb"> | null = null;
function getEcho(): Echo<"reverb"> {
  if (!echo) {
    (window as unknown as Record<string, unknown>).Pusher = Pusher;
    echo = new Echo({
      broadcaster: "reverb",
      key:         import.meta.env.VITE_REVERB_APP_KEY  ?? "local",
      wsHost:      import.meta.env.VITE_REVERB_HOST     ?? "127.0.0.1",
      wsPort:      Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
      wssPort:     Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
      forceTLS:    (import.meta.env.VITE_REVERB_SCHEME  ?? "http") === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint: "/broadcasting/auth",
      auth: { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` } },
    } as Parameters<typeof Echo>[0]);
  }
  return echo;
}

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

interface ApiConversation {
  id: string;
  participant_name: string;
  participant_role: string;
  participant_user_id: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  course_id?: string | null;
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
}

export function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages]   = useState<ApiMessage[]>([]);
  const [input, setInput]         = useState("");
  const [searchConvo, setSearchConvo] = useState("");
  const [sending, setSending]     = useState(false);
  const [filePreview, setFilePreview] = useState<File | null>(null);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  // Load conversation list
  useEffect(() => {
    messagingApi.conversations().then((res) => {
      setConversations(res.data.data ?? res.data ?? []);
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Subscribe Reverb channel when conversation changes
  useEffect(() => {
    if (!selectedConvId) return;
    messagingApi.messages(selectedConvId).then((res) => {
      setMessages(res.data.data ?? res.data ?? []);
    });
    const ch = getEcho().private(`conversation.${selectedConvId}`);
    ch.listen(".message.sent", (data: ApiMessage) => {
      setMessages((prev) => [...prev, data]);
    });
    ch.listen(".reaction.added", (data: { message_id: string; reactions: Record<string, string[]> }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message_id ? { ...m, reactions: data.reactions } : m))
      );
    });
    return () => { getEcho().leave(`conversation.${selectedConvId}`); };
  }, [selectedConvId]);

  // Presence channel
  useEffect(() => {
    if (!user) return;
    const p = getEcho().join("online-users") as unknown as {
      here:    (fn: (members: { id: string }[]) => void) => unknown;
      joining: (fn: (member: { id: string })  => void)   => unknown;
      leaving: (fn: (member: { id: string })  => void)   => unknown;
    };
    p.here((ms) => setOnlineUsers(new Set(ms.map((m) => m.id))))
     .joining((m) => setOnlineUsers((prev) => new Set([...prev, m.id])))
     .leaving((m) => setOnlineUsers((prev) => { const s = new Set(prev); s.delete(m.id); return s; }));
    return () => { getEcho().leave("online-users"); };
  }, [user]);

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
      setInput("");
      setFilePreview(null);
    } finally {
      setSending(false);
    }
  }, [input, filePreview, selectedConvId, sending]);

  const handleReact = async (messageId: string, emoji: string) => {
    if (!selectedConvId) return;
    setReactionTarget(null);
    const res = await messagingApi.react(messageId, emoji);
    const updated = res.data.data;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reactions: updated.reactions } : m))
    );
  };

  const isOnline = (id: string) => onlineUsers.has(id);

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const filteredConvos = conversations.filter(
    (c) =>
      c.participant_name.toLowerCase().includes(searchConvo.toLowerCase()) ||
      (c.participant_role ?? "").toLowerCase().includes(searchConvo.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl overflow-hidden flex" style={{ height: "calc(100vh - 140px)", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r" style={{ borderColor: "#f1f5f9" }}>
        <div className="p-4 border-b" style={{ borderColor: "#f1f5f9" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Messages</h2>
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
          {filteredConvos.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <MessageSquare size={32} className="mb-2 opacity-40" />
              <p style={{ fontSize: "13px" }}>No conversations yet</p>
            </div>
          )}
          {filteredConvos.map((convo) => {
            const online = isOnline(convo.participant_user_id);
            return (
              <div key={convo.id}
                onClick={() => setSelectedConvId(convo.id)}
                className="flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-slate-50"
                style={{ backgroundColor: selectedConvId === convo.id ? "#eff6ff" : "transparent" }}>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                    {initials(convo.participant_name)}
                  </div>
                  {online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: "#22c55e" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{convo.participant_name}</p>
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
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>{convo.participant_role}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#f1f5f9" }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                    {initials(selectedConv.participant_name)}
                  </div>
                  {isOnline(selectedConv.participant_user_id) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: "#22c55e" }} />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{selectedConv.participant_name}</p>
                  <p style={{ fontSize: "11px", color: isOnline(selectedConv.participant_user_id) ? "#22c55e" : "#94a3b8", fontWeight: isOnline(selectedConv.participant_user_id) ? 500 : 400 }}>
                    {isOnline(selectedConv.participant_user_id) ? "● Online" : selectedConv.participant_role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                  <MoreHorizontal size={17} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ backgroundColor: "#f8fafc" }}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p style={{ fontSize: "13px" }}>No messages yet. Say hello!</p>
                </div>
              ) : messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex group ${isOwn ? "justify-end" : "justify-start"}`}>
                    {!isOwn && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold mr-2 mt-auto flex-shrink-0">
                        {initials(msg.sender_name)}
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"} max-w-xs lg:max-w-md`}>
                      <div className="relative"
                        style={{
                          backgroundColor: isOwn ? "#2563eb" : "white",
                          color: isOwn ? "white" : "#1e293b",
                          borderRadius: "16px",
                          borderBottomRightRadius: isOwn ? "4px" : "16px",
                          borderBottomLeftRadius: isOwn ? "16px" : "4px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          padding: "10px 16px",
                        }}>
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
                        <p style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px", textAlign: isOwn ? "right" : "left" }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {/* Reaction button on hover */}
                        <button onClick={() => setReactionTarget(reactionTarget === msg.id ? null : msg.id)}
                          className="absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-sm"
                          style={isOwn ? { left: "-28px" } : { right: "-28px" }}>
                          <Smile size={11} className="text-slate-400" />
                        </button>
                      </div>

                      {/* Emoji picker */}
                      {reactionTarget === msg.id && (
                        <div className={`flex gap-1 bg-white border border-slate-200 rounded-full shadow-lg px-2 py-1 z-10 ${isOwn ? "mr-1" : "ml-1"}`}>
                          {EMOJI_LIST.map((emoji) => (
                            <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                              className="text-base hover:scale-125 transition-transform">{emoji}</button>
                          ))}
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
            <div className="p-4 border-t" style={{ borderColor: "#f1f5f9" }}>
              <div className="flex items-center gap-3 bg-white rounded-2xl border px-4 py-2" style={{ borderColor: "#e2e8f0" }}>
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={(e) => setFilePreview(e.target.files?.[0] ?? null)} />
                <button onClick={() => fileInputRef.current?.click()}
                  className="text-slate-400 hover:text-blue-500 transition-colors">
                  <Paperclip size={17} />
                </button>
                <input
                  type="text" placeholder="Type a message..." value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 focus:outline-none text-slate-700 bg-transparent"
                  style={{ fontSize: "13px" }} />
                <button className="text-slate-400 hover:text-yellow-500 transition-colors" title="Emoji reactions on messages">
                  <Smile size={17} />
                </button>
                <button onClick={handleSend} disabled={(!input.trim() && !filePreview) || sending}
                  className="p-2 rounded-xl text-white transition-all"
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
    </div>
  );
}