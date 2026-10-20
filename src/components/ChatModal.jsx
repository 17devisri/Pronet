import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageSquare, Check, Clock } from "lucide-react";
import Avatar from "./Avatar";
import Button from "./Button";
import { Input } from "./Input";
import { useToast } from "./Toast";
import { API_BASE_URL } from "../config/api";

export default function ChatModal({ open, onClose, currentUser, targetUser, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const isPollingRef = useRef(false);
  const showToast = useToast();

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!open || !currentUser?.user_name || !targetUser?.user_name) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async (silent = true) => {
      if (isPollingRef.current && silent) return;
      if (!silent) setLoading(true);
      isPollingRef.current = true;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/connections/messages?user1=${currentUser.user_name}&user2=${targetUser.user_name}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data && Array.isArray(data.messages)) {
          setMessages((prev) => {
            const optimisticMsgs = prev.filter((m) => m.isOptimistic);
            const serverMsgs = data.messages;

            const currentServerMsgs = prev.filter((m) => !m.isOptimistic);
            const hasChanged =
              currentServerMsgs.length !== serverMsgs.length ||
              (serverMsgs.length > 0 &&
                currentServerMsgs[currentServerMsgs.length - 1]?.id !==
                  serverMsgs[serverMsgs.length - 1]?.id);

            if (hasChanged || optimisticMsgs.length > 0) {
              // If new messages came in from the other user, auto-scroll to bottom
              if (currentServerMsgs.length < serverMsgs.length) {
                setTimeout(() => scrollToBottom("smooth"), 50);
              }
              return [...serverMsgs, ...optimisticMsgs];
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn("Failed to load chat messages", err);
      } finally {
        isPollingRef.current = false;
        if (isMounted && !silent) {
          setLoading(false);
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      }
    };

    // Initial load
    fetchMessages(false);

    // Fast 1.5s polling loop so any sent message updates instantly without reloading
    const pollInterval = setInterval(() => {
      fetchMessages(true);
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [open, currentUser?.user_name, targetUser?.user_name]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    const textToSend = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: currentUser.user_name,
      receiver: targetUser.user_name,
      text: textToSend,
      time: "Sending...",
      isOptimistic: true,
    };

    // 1. Immediately show message in chat for zero lag
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setSending(true);
    setTimeout(() => scrollToBottom("smooth"), 30);

    try {
      const res = await fetch(`${API_BASE_URL}/api/connections/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: currentUser.user_name,
          receiver: targetUser.user_name,
          text: textToSend,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send message");
      }

      const savedMsg = await res.json();

      // 2. Replace the optimistic message with the confirmed saved DB record
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? savedMsg : m))
      );

      if (onMessageSent) {
        onMessageSent(savedMsg);
      }
    } catch (err) {
      showToast(err.message || "Could not send message", "error");
      // Remove failed optimistic message and restore draft
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(textToSend);
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom("smooth"), 50);
    }
  };

  if (!open || !targetUser) return null;

  const targetAvatar =
    targetUser.avatar ||
    `https://api.dicebear.com/9.x/notionists/svg?seed=${targetUser.user_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-lg h-[550px] max-h-[90vh] glass-strong rounded-3xl flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-slate-900/10 dark:border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={targetAvatar} online size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {targetUser.user_name}
                </p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate">
                  {targetUser.title || "Connected Developer"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-500 dark:text-slate-400">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Direct message with @{targetUser.user_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Say hi and discuss collaboration, tech stacks, or project ideas!
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.sender === currentUser?.user_name;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-br-xs shadow-md shadow-indigo-500/20"
                          : "bg-slate-900/8 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-900/5 dark:border-white/5"
                      }`}
                    >
                      {m.text}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                      <span>{m.time || "Just now"}</span>
                      {isMine && (
                        m.isOptimistic ? (
                          <Clock className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <Check className="w-2.5 h-2.5 text-indigo-400" />
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 flex gap-2"
          >
            <Input
              placeholder={`Message ${targetUser.user_name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button size="icon" type="submit" disabled={sending || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
