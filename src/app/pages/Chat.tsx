import { useState, useRef, useEffect } from "react";
import { Send, Search, Phone, Video, MoreHorizontal, Paperclip, Smile } from "lucide-react";

interface Conversation {
  id: number;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  course?: string;
  courseColor?: string;
}

interface Message {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
}

const conversations: Conversation[] = [
  { id: 1, name: "Adelfina Mambali", role: "CS301 Instructor", avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face", lastMessage: "Great question! The key difference is...", time: "2m ago", unread: 2, online: true, course: "CS301", courseColor: "#2563eb" },
  { id: 2, name: "Hamis Kalira", role: "Student · CS301", avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face", lastMessage: "Are you joining the study group Saturday?", time: "1h ago", unread: 1, online: true },
  { id: 3, name: "Aman Mfiringe", role: "CD312 Instructor", avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face", lastMessage: "I've posted the lecture notes for Ch. 8", time: "3h ago", unread: 0, online: false, course: "CD312", courseColor: "#7c3aed" },
  { id: 4, name: "CS301 Study Group", role: "6 members", avatar: "https://images.unsplash.com/photo-1763615834709-cd4b196980db?w=60&h=60&fit=crop", lastMessage: "Morgan: What time works for everyone?", time: "5h ago", unread: 4, online: false },
  { id: 5, name: "Kelvin Chacha", role: "Student · CS450", avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face", lastMessage: "Thanks for explaining gradient descent!", time: "1d ago", unread: 0, online: false },
  { id: 6, name: "Dr. Yulitha Lutatina", role: "IT315 Instructor", avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face", lastMessage: "Your lab report was well-written!", time: "2d ago", unread: 0, online: true, course: "IT315", courseColor: "#059669" },
];

const messagesByConversation: Record<number, Message[]> = {
  1: [
    { id: 1, sender: "me", text: "Hi Dr. Chen, I had a question about Assignment 3. What's the difference between dropna() and fillna() and when should I use each?", time: "10:24 AM" },
    { id: 2, sender: "them", text: "Great question! The key difference is: dropna() removes rows/columns with missing values entirely, while fillna() replaces them with a specified value.", time: "10:28 AM" },
    { id: 3, sender: "them", text: "Use dropna() when missing data is random and won't create bias. Use fillna() when you can meaningfully impute values (mean, median, forward-fill, etc.).", time: "10:29 AM" },
    { id: 4, sender: "me", text: "That makes a lot of sense! So for our dataset with the sensor readings, I should probably use fillna() with forward-fill since the data is time-series?", time: "10:32 AM" },
    { id: 5, sender: "them", text: "Exactly right! Forward-fill (ffill) makes perfect sense for time-series sensor data. Good thinking 👍", time: "10:35 AM" },
  ],
  2: [
    { id: 1, sender: "them", text: "Hey! Are you joining the study group Saturday at the library?", time: "Yesterday 4:15 PM" },
    { id: 2, sender: "me", text: "Yes! What time are you thinking?", time: "Yesterday 4:18 PM" },
    { id: 3, sender: "them", text: "Probably 2-5pm. We'll focus on Modules 4-6 for the midterm.", time: "Yesterday 4:20 PM" },
  ],
};

export function Chat() {
  const [activeConvo, setActiveConvo] = useState<Conversation>(conversations[0]);
  const [messages, setMessages] = useState<Message[]>(messagesByConversation[1] || []);
  const [input, setInput] = useState("");
  const [searchConvo, setSearchConvo] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConvo = (convo: Conversation) => {
    setActiveConvo(convo);
    setMessages(messagesByConversation[convo.id] || []);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      sender: "me",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  const filteredConvos = conversations.filter(
    (c) => c.name.toLowerCase().includes(searchConvo.toLowerCase()) || c.role.toLowerCase().includes(searchConvo.toLowerCase())
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
              type="text"
              placeholder="Search conversations..."
              value={searchConvo}
              onChange={(e) => setSearchConvo(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              style={{ fontSize: "12px", borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvos.map((convo) => (
            <div
              key={convo.id}
              onClick={() => selectConvo(convo)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${activeConvo.id === convo.id ? "" : "hover:bg-slate-50"}`}
              style={{ backgroundColor: activeConvo.id === convo.id ? "#eff6ff" : "transparent" }}
            >
              <div className="relative flex-shrink-0">
                <img src={convo.avatar} alt={convo.name} className="w-10 h-10 rounded-full object-cover" />
                {convo.online && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: "#22c55e" }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{convo.name}</p>
                  <p style={{ fontSize: "10px", color: "#94a3b8" }}>{convo.time}</p>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="truncate" style={{ fontSize: "11px", color: "#94a3b8", maxWidth: "160px" }}>
                    {convo.lastMessage}
                  </p>
                  {convo.unread > 0 && (
                    <span
                      className="flex-shrink-0 text-white rounded-full flex items-center justify-center ml-2"
                      style={{ fontSize: "10px", fontWeight: 700, width: "18px", height: "18px", backgroundColor: "#2563eb" }}
                    >
                      {convo.unread}
                    </span>
                  )}
                </div>
                {convo.course && (
                  <span
                    className="inline-block mt-1 px-1.5 py-0.5 rounded-md"
                    style={{ fontSize: "9px", fontWeight: 600, backgroundColor: `${convo.courseColor}15`, color: convo.courseColor }}
                  >
                    {convo.course}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#f1f5f9" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={activeConvo.avatar} alt={activeConvo.name} className="w-9 h-9 rounded-full object-cover" />
              {activeConvo.online && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: "#22c55e" }} />
              )}
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{activeConvo.name}</p>
              <p style={{ fontSize: "11px", color: activeConvo.online ? "#22c55e" : "#94a3b8", fontWeight: activeConvo.online ? 500 : 400 }}>
                {activeConvo.online ? "● Online" : activeConvo.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"><Phone size={17} /></button>
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"><Video size={17} /></button>
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"><MoreHorizontal size={17} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ backgroundColor: "#f8fafc" }}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p style={{ fontSize: "13px" }}>No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "them" && (
                  <img src={activeConvo.avatar} alt="" className="w-7 h-7 rounded-full object-cover mr-2 mt-auto flex-shrink-0" />
                )}
                <div
                  className="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl"
                  style={{
                    backgroundColor: msg.sender === "me" ? "#2563eb" : "white",
                    color: msg.sender === "me" ? "white" : "#1e293b",
                    borderBottomRightRadius: msg.sender === "me" ? "4px" : "16px",
                    borderBottomLeftRadius: msg.sender === "them" ? "4px" : "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                    lineHeight: "1.5",
                  }}
                >
                  {msg.text}
                  <p style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px", textAlign: msg.sender === "me" ? "right" : "left" }}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: "#f1f5f9" }}>
          <div className="flex items-center gap-3 bg-white rounded-2xl border px-4 py-2" style={{ borderColor: "#e2e8f0" }}>
            <button className="text-slate-400 hover:text-blue-500 transition-colors">
              <Paperclip size={17} />
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 focus:outline-none text-slate-700 bg-transparent"
              style={{ fontSize: "13px" }}
            />
            <button className="text-slate-400 hover:text-yellow-500 transition-colors">
              <Smile size={17} />
            </button>
            <button
              onClick={sendMessage}
              className="p-2 rounded-xl text-white transition-all"
              style={{ backgroundColor: input.trim() ? "#2563eb" : "#cbd5e1" }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}