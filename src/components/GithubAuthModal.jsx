import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Code2, CheckCircle2, AlertCircle, ExternalLink, Loader2, GitFork, Users, BookOpen } from "lucide-react";
import Button from "./Button";
import { Input } from "./Input";
import { useToast } from "./Toast";
import { API_BASE_URL } from "../config/api";

// GitHub Brand Icon
function GithubIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function GithubAuthModal({
  open,
  onClose,
  mode = "connect", // "connect" (link to existing user) or "auth" (sign in / sign up)
  currentUsername = null,
  onSuccess,
}) {
  const [handleInput, setHandleInput] = useState("");
  const [preview, setPreview] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    if (!open) {
      setHandleInput("");
      setPreview(null);
      setError(null);
      setVerifying(false);
      setSubmitting(false);
    }
  }, [open]);

  // Clean username from input
  const extractCleanUsername = (raw) => {
    let clean = (raw || "").trim();
    if (clean.includes("github.com/")) {
      clean = clean.split("github.com/")[1].split("/")[0].split("?")[0];
    }
    return clean.replace(/^@+/, "").trim();
  };

  const handleVerify = async (usernameToVerify) => {
    const username = extractCleanUsername(usernameToVerify || handleInput);
    if (!username) {
      setError("Please enter a GitHub username or profile link");
      setPreview(null);
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: { Accept: "application/vnd.github.v3+json" },
      });

      if (res.status === 404) {
        throw new Error(`GitHub user "@${username}" not found. Please check spelling.`);
      }

      if (!res.ok) {
        // Fallback for rate limits
        setPreview({
          login: username,
          name: username,
          avatar_url: `https://github.com/${username}.png`,
          html_url: `https://github.com/${username}`,
          bio: "GitHub Developer",
          public_repos: 0,
          followers: 0,
        });
        setVerifying(false);
        return;
      }

      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setError(err.message || "Failed to reach GitHub");
      setPreview(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const cleanHandle = preview?.login || extractCleanUsername(handleInput);
    if (!cleanHandle) {
      setError("Please provide a valid GitHub username");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        github_username: cleanHandle,
      };

      if (mode === "connect" && currentUsername) {
        payload.link_user = currentUsername;
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "GitHub authentication failed");
      }

      showToast(data.message || "GitHub connected successfully!", "success");
      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to complete GitHub authentication");
      showToast(err.message || "Failed to connect", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md glass-strong rounded-3xl p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-slate-900/10 dark:border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-md">
                <GithubIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {mode === "connect" ? "Connect GitHub" : "GitHub Authentication"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === "connect"
                    ? "Link your GitHub account to your Pronet profile"
                    : "Sign in or create an account with GitHub"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                GitHub Username or Profile URL
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. torvalds or github.com/username"
                  value={handleInput}
                  onChange={(e) => {
                    setHandleInput(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !preview) {
                      e.preventDefault();
                      handleVerify();
                    }
                  }}
                  className="flex-1 text-sm"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  disabled={verifying || !handleInput.trim()}
                  onClick={() => handleVerify()}
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Preview Card */}
            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={preview.avatar_url}
                    alt={preview.login}
                    className="w-12 h-12 rounded-full border border-slate-900/10 dark:border-white/20 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {preview.name || preview.login}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                    <a
                      href={preview.html_url || `https://github.com/${preview.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      @{preview.login} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {preview.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                    &quot;{preview.bio}&quot;
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-900/5 dark:border-white/5">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {preview.public_repos ?? 0} repos
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {preview.followers ?? 0} followers
                  </span>
                  {preview.location && <span className="truncate">📍 {preview.location}</span>}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={submitting || (!preview && !handleInput.trim())}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    {mode === "connect" ? "Connecting..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    <GithubIcon className="w-4 h-4 mr-1.5" />
                    {mode === "connect"
                      ? preview
                        ? `Connect @${preview.login}`
                        : "Connect GitHub"
                      : preview
                      ? `Continue as @${preview.login}`
                      : "Continue with GitHub"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export { GithubIcon };
