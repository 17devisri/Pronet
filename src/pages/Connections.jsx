import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus2, Check, Clock, X, MessageSquare, MapPin, Users, ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import ChatModal from "../components/ChatModal";
import PageTransition, { staggerContainer, staggerItem } from "../components/PageTransition";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

export default function Connections() {
  const [users, setUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState({});
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const showToast = useToast();
  const { user } = useAuth();

  const currentUsername = user?.user_name;

  const fetchConnectionsData = () => {
    fetch(`${API_BASE_URL}/api/connections?user=${currentUsername}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load connections");
        return res.json();
      })
      .then((data) => {
        const userList = Array.isArray(data) ? data : (data.users || []);
        const inbound = data.incoming_requests || [];

        setUsers(userList);
        setIncomingRequests(inbound);

        const initialMap = {};
        userList.forEach((u) => {
          initialMap[u.user_name] = u.connection_status || (u.is_connected ? "connected" : "none");
        });
        setStatusMap(initialMap);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConnectionsData();
  }, [currentUsername]);

  const handleConnect = async (targetUser) => {
    const currentStatus = statusMap[targetUser.user_name] || "none";
    let nextStatus = "pending_sent";
    if (currentStatus === "pending_sent" || currentStatus === "connected") {
      nextStatus = "none";
    }

    // Optimistic UI update
    setStatusMap((prev) => ({
      ...prev,
      [targetUser.user_name]: nextStatus,
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/connections/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: currentUsername,
          target_user: targetUser.user_name,
        }),
      });

      if (!res.ok) throw new Error("Connection failed");
      const resData = await res.json();

      if (resData.status) {
        setStatusMap((prev) => ({
          ...prev,
          [targetUser.user_name]: resData.status,
        }));
      }

      showToast(resData.message || "Updated connection status", "success");
    } catch (err) {
      showToast(err.message || "Connection request updated", "info");
      fetchConnectionsData();
    }
  };

  const handleRespond = async (inboundReq, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/connections/${inboundReq.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error("Response failed");
      const data = await res.json();

      setIncomingRequests((prev) => prev.filter((r) => r.id !== inboundReq.id));
      setStatusMap((prev) => ({
        ...prev,
        [inboundReq.user.user_name]: action === "accept" ? "connected" : "none",
      }));

      showToast(data.message, "success");
    } catch (err) {
      showToast(err.message || "Updated request", "error");
    }
  };

  const handleOpenChat = (targetUser) => {
    const status = statusMap[targetUser.user_name] || "none";
    if (status !== "connected") {
      showToast(`Connect with ${targetUser.user_name} first before sending direct messages.`, "info");
      return;
    }
    setChatTarget(targetUser);
  };

  return (
    <PageTransition className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Developer Network</h1>
        <p className="text-slate-600 dark:text-slate-400">
          {loading ? "Loading users from database..." : `${users.length} registered developers in network.`}
        </p>
      </div>

      {/* Compact / Collapsible Connection Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="mb-8">
          <GlassCard className="p-4 overflow-hidden border border-indigo-500/30 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    Connection Requests
                    <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                      {incomingRequests.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Developers wanting to join your network.
                  </p>
                </div>
              </div>

              <Button
                size="xs"
                variant="ghost"
                onClick={() => setRequestsExpanded((prev) => !prev)}
                className="gap-1 text-xs"
              >
                {requestsExpanded ? (
                  <>Hide <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>View Requests ({incomingRequests.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </Button>
            </div>

            {/* Expandable Requests Tray (max height 260px scrollable so it never blocks the grid) */}
            <AnimatePresence>
              {requestsExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden border-t border-slate-900/10 dark:border-white/10 pt-3"
                >
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                    {incomingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={
                              req.user?.avatar ||
                              `https://api.dicebear.com/9.x/notionists/svg?seed=${req.user?.user_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`
                            }
                            online
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {req.user?.user_name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {req.user?.title || "Developer"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="xs" variant="success" onClick={() => handleRespond(req, "accept")} className="px-2 py-1 text-xs">
                            <Check className="w-3 h-3" /> Accept
                          </Button>
                          <Button size="xs" variant="glass" onClick={() => handleRespond(req, "decline")} className="px-2 py-1 text-xs">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i} className="p-6 flex flex-col items-center text-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-slate-800/40 mb-4" />
              <div className="h-4 w-32 bg-slate-800/40 rounded mb-2" />
              <div className="h-3 w-24 bg-slate-800/40 rounded mb-4" />
              <div className="h-8 w-full bg-slate-800/40 rounded" />
            </GlassCard>
          ))}
        </div>
      ) : users.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">No other developers found in database yet.</p>
        </GlassCard>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {users.map((u) => {
            const status = statusMap[u.user_name] || "none";
            const avatarUrl =
              u.avatar ||
              `https://api.dicebear.com/9.x/notionists/svg?seed=${u.user_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

            return (
              <GlassCard key={u.id || u.user_name} variants={staggerItem} className="p-6 flex flex-col items-center text-center">
                <Avatar src={avatarUrl} online size="xl" ring className="mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                  {u.user_name}
                </h3>
                <p className="text-xs text-indigo-500 dark:text-indigo-400 mb-1">@{u.user_name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-1">
                  {u.title || "Full-Stack Developer"}
                </p>
                {u.location && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-4">
                    <MapPin className="w-3 h-3" /> {u.location}
                  </p>
                )}
                <div className="flex gap-2 w-full mt-auto">
                  <Button
                    size="sm"
                    variant={status === "connected" ? "glass" : status === "pending_sent" ? "glass" : "primary"}
                    className="flex-1"
                    onClick={() => handleConnect(u)}
                  >
                    {status === "connected" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" /> Connected
                      </>
                    ) : status === "pending_sent" ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-400" /> Requested
                      </>
                    ) : status === "pending_received" ? (
                      <>
                        <Check className="w-4 h-4 text-indigo-400" /> Accept Request
                      </>
                    ) : (
                      <>
                        <UserPlus2 className="w-4 h-4" /> Connect
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "connected" ? "primary" : "ghost"}
                    className="flex-1 relative"
                    onClick={() => handleOpenChat(u)}
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                    {u.unread_count > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                        {u.unread_count}
                      </span>
                    )}
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </motion.div>
      )}

      {/* Direct Chat Modal for Connected Users */}
      <ChatModal
        open={!!chatTarget}
        onClose={() => setChatTarget(null)}
        currentUser={user}
        targetUser={chatTarget}
      />
    </PageTransition>
  );
}
