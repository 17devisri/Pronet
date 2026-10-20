import { useState } from "react";
import { Send } from "lucide-react";
import Modal from "./Modal";
import { Input } from "./Input";
import Button from "./Button";
import Avatar from "./Avatar";
import { useToast } from "./Toast";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

export default function CollaborateModal({ project, open, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const showToast = useToast();
  const { user } = useAuth();

  if (!project) return null;

  const ownerName = project.owner?.user_name || project.owner?.name || "the project owner";
  const ownerAvatar = project.owner?.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=owner&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  const handleSend = async () => {
    if (!user) {
      showToast("Please sign in to send collaboration requests", "error");
      return;
    }

    setSending(true);
    const activeUsername = user.user_name;

    try {
      const res = await fetch(`${API_BASE_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          user_name: activeUsername,
          message: message.trim() || "I'd like to collaborate on this project."
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to send request");
      }

      showToast(`Request sent to ${ownerName}!`, "success");
      setMessage("");
      onClose();
    } catch (err) {
      showToast(err.message || `Request sent to ${ownerName}!`, "info");
      setMessage("");
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Request to Collaborate">
      <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10">
        <Avatar src={ownerAvatar} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{project.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">by {ownerName}</p>
        </div>
      </div>
      <Input
        textarea
        label="Message to the owner"
        placeholder="Tell them why you'd be a great fit for this project..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex justify-end gap-3 mt-5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSend} disabled={sending}>
          <Send className="w-4 h-4" />
          {sending ? "Sending..." : "Send Request"}
        </Button>
      </div>
    </Modal>
  );
}
