import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, GitFork, Users } from "lucide-react";
import GlassCard from "./GlassCard";
import Avatar from "./Avatar";
import Button from "./Button";
import { TechPill, RolePill } from "./Pill";
import { staggerItem } from "./PageTransition";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import { API_BASE_URL } from "../config/api";

export default function ProjectCard({ project, onCollaborate }) {
  const { user } = useAuth();
  const showToast = useToast();
  if (!project) return null;

  const currentUsername = user?.user_name;
  const projectOwnerUsername = project.owner?.user_name;
  const isOwnProject = currentUsername && projectOwnerUsername && currentUsername === projectOwnerUsername;

  const initialStarred = Boolean(
    currentUsername && Array.isArray(project.liked_by) && project.liked_by.includes(currentUsername)
  );
  const initialForked = Boolean(
    currentUsername && Array.isArray(project.forked_by) && project.forked_by.includes(currentUsername)
  );

  const [stars, setStars] = useState(project.stars ?? 0);
  const [forks, setForks] = useState(project.forks ?? 0);
  const [isStarred, setIsStarred] = useState(initialStarred);
  const [isForked, setIsForked] = useState(initialForked);
  const [isStarring, setIsStarring] = useState(false);
  const [isForking, setIsForking] = useState(false);

  useEffect(() => {
    setStars(project.stars ?? 0);
    setForks(project.forks ?? 0);
    if (currentUsername) {
      if (Array.isArray(project.liked_by)) {
        setIsStarred(project.liked_by.includes(currentUsername));
      }
      if (Array.isArray(project.forked_by)) {
        setIsForked(project.forked_by.includes(currentUsername));
      }
    }
  }, [project, currentUsername]);

  const collabs = Array.isArray(project.collaborators) ? project.collaborators : [];
  const isCollaborator = currentUsername && collabs.some(
    (c) => (c.user_name && c.user_name === currentUsername) || (c.name && c.name === currentUsername)
  );

  const ownerName = project.owner?.name || project.owner?.user_name || "Developer";
  const ownerHandle = project.owner?.handle || (project.owner?.user_name ? `@${project.owner.user_name}` : "@developer");
  const ownerAvatar = project.owner?.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${ownerName}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  const roles = Array.isArray(project.roles_needed)
    ? project.roles_needed
    : (Array.isArray(project.rolesNeeded) ? project.rolesNeeded : []);
  const techList = Array.isArray(project.tech) ? project.tech : [];

  const handleStar = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isStarring) return;

    if (!currentUsername) {
      showToast("Please log in to like projects", "error");
      return;
    }

    setIsStarring(true);
    const action = isStarred ? "unstar" : "star";
    const nextStarred = !isStarred;
    const nextStars = nextStarred ? stars + 1 : Math.max(0, stars - 1);

    // Optimistic UI
    setIsStarred(nextStarred);
    setStars(nextStars);

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${project.id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, user_name: currentUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.already_liked) {
          setIsStarred(true);
          setStars(data.stars ?? stars);
          showToast("You have already liked this project", "info");
          return;
        }
        throw new Error(data.message || "Failed to update like");
      }
      if (data.stars !== undefined) setStars(data.stars);
      showToast(nextStarred ? "Liked project!" : "Unliked project", "success");
    } catch (err) {
      // Revert if error
      setIsStarred(!nextStarred);
      setStars(stars);
      showToast(err.message || "Could not update like", "error");
    } finally {
      setIsStarring(false);
    }
  };

  const handleFork = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isForking || isForked) return;

    if (!currentUsername) {
      showToast("Please log in to fork projects", "error");
      return;
    }

    setIsForking(true);
    setIsForked(true);
    setForks(forks + 1);

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${project.id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fork", user_name: currentUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.already_forked) {
          showToast("You have already forked this project", "info");
          return;
        }
        throw new Error(data.message || "Failed to fork");
      }
      if (data.forks !== undefined) setForks(data.forks);
      showToast("Project forked to your workspace!", "success");
    } catch (_) {
      setIsForked(false);
      setForks(forks);
    } finally {
      setIsForking(false);
    }
  };

  return (
    <GlassCard as={motion.div} variants={staggerItem} className="p-6 flex flex-col gap-4 group">
      <div className="flex items-center justify-between">
        <Link to={`/project/${project.id}`} className="flex items-center gap-3 min-w-0">
          <Avatar src={ownerAvatar} online size="md" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{ownerName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ownerHandle}</p>
          </div>
        </Link>

        {/* Real Interactive Like & Fork Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleStar}
            title={isStarred ? "Unlike" : "Like (Star)"}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl border transition-all ${
              isStarred
                ? "bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm shadow-amber-500/10"
                : "bg-slate-900/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-900/10 dark:border-white/10 hover:text-amber-500 hover:border-amber-500/30"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-500 text-amber-500" : ""}`} />
            <span>{stars}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleFork}
            title="Fork Project"
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl border transition-all ${
              isForked
                ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40 shadow-sm shadow-indigo-500/10"
                : "bg-slate-900/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-900/10 dark:border-white/10 hover:text-indigo-400 hover:border-indigo-500/30"
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>{forks}</span>
          </motion.button>
        </div>
      </div>

      <Link to={`/project/${project.id}`} className="block">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug mb-1.5 group-hover:text-gradient transition-all">
          {project.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{project.tagline}</p>
      </Link>

      {techList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {techList.slice(0, 4).map((t) => (
            <TechPill key={t} label={t} />
          ))}
        </div>
      )}

      {roles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <RolePill key={r} label={r} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-900/8 dark:border-white/8">
        <div className="flex items-center -space-x-2">
          {collabs.slice(0, 3).map((c) => (
            <Avatar
              key={c.id || c.user_name}
              src={c.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${c.user_name || 'collab'}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
              size="xs"
              className="ring-2 ring-[#f8f9fd] dark:ring-[#0f1117]"
            />
          ))}
          {collabs.length > 0 && (
            <span className="ml-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Users className="w-3 h-3" /> {collabs.length}
            </span>
          )}
        </div>
        {isOwnProject ? (
          <span className="text-xs px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            Your Project
          </span>
        ) : isCollaborator ? (
          <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Collaborator
          </span>
        ) : (
          <Button size="sm" onClick={() => onCollaborate?.(project)}>
            Collaborate
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
