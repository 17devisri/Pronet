import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Inbox } from "lucide-react";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import PageTransition, { staggerContainer, staggerItem } from "../components/PageTransition";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exitDir, setExitDir] = useState({});
  const showToast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.user_name) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/requests?user=${user.user_name}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data
            .filter((r) => !r.status || r.status === "pending")
            .map((r) => ({
            id: r.id,
            user: {
              name: r.user?.user_name || "Developer",
              handle: `@${r.user?.user_name || "user"}`,
              avatar: r.user?.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${r.user?.user_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
              online: true,
            },
            project: {
              id: r.project?.id || "p1",
              title: r.project?.title || "Project",
            },
            message: r.message,
            time: "Recently",
          }));
          setRequests(formatted);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const respond = async (req, accepted) => {
    setExitDir((d) => ({ ...d, [req.id]: accepted ? 1 : -1 }));

    try {
      await fetch(`${API_BASE_URL}/api/requests/${req.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: accepted ? "accept" : "decline" }),
      });
    } catch (_) {}

    setTimeout(() => {
      setRequests((r) => r.filter((x) => x.id !== req.id));
      showToast(
        accepted
          ? `Accepted ${req.user.name} for ${req.project.title} (Added to Contributors)`
          : `Declined ${req.user.name}'s request`,
        accepted ? "success" : "info"
      );
    }, 260);
  };

  return (
    <PageTransition className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Collaboration Requests</h1>
        <p className="text-slate-600 dark:text-slate-400">Review who wants to join your projects.</p>
      </div>

      {requests.length === 0 ? (
        <GlassCard className="p-14 text-center" hover={false}>
          <Inbox className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">You're all caught up — no pending requests.</p>
        </GlassCard>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
          <AnimatePresence>
            {requests.map((req) => (
              <motion.div
                key={req.id}
                variants={staggerItem}
                layout
                exit={{
                  opacity: 0,
                  x: (exitDir[req.id] || 0) * 120,
                  scale: 0.9,
                  transition: { duration: 0.25 },
                }}
              >
                <GlassCard hover={false} className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <Avatar src={req.user.avatar} online={req.user.online} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {req.user.name} <span className="text-slate-500 dark:text-slate-400 font-normal">{req.user.handle}</span>
                        </p>
                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{req.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        wants to join{" "}
                        <Link to={`/project/${req.project.id}`} className="text-indigo-600 dark:text-indigo-300 hover:underline">
                          {req.project.title}
                        </Link>
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{req.message}</p>
                      <div className="flex gap-3">
                        <Button size="sm" variant="success" onClick={() => respond(req, true)}>
                          <Check className="w-4 h-4" /> Accept
                        </Button>
                        <Button size="sm" variant="glass" onClick={() => respond(req, false)}>
                          <X className="w-4 h-4" /> Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </PageTransition>
  );
}
