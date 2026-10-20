import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Braces, Mail, Lock, User, Code2, Eye, EyeOff, Briefcase, MapPin } from "lucide-react";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import { Input } from "../components/Input";
import PageTransition from "../components/PageTransition";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import GithubAuthModal, { GithubIcon } from "../components/GithubAuthModal";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [showPw, setShowPw] = useState(false);

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const showToast = useToast();
  const { login, register, loginWithGithub } = useAuth();
  const [githubModalOpen, setGithubModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        showToast("Signed in successfully!", "success");
      } else {
        await register({
          user_name: userName,
          email,
          password,
          title: title.trim() || "Full-Stack Developer",
          location: location.trim() || "Bengaluru, India",
        });
        showToast("Account created successfully!", "success");
      }
      navigate("/feed");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-[calc(100vh-90px)] flex items-center justify-center px-4 py-12 relative">
      <div className="pointer-events-none absolute top-10 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[120px]" />

      <GlassCard variant="strong" hover={false} className="relative w-full max-w-md p-8 sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.5)] mb-4"
          >
            <Braces className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            {mode === "login" ? "Sign in to keep building." : "Join developers shipping together."}
          </p>
        </div>

        <div className="flex p-1 rounded-2xl neu-pressed mb-7">
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="relative flex-1 py-2 text-sm font-medium rounded-xl transition-colors"
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-toggle"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${mode === m ? "text-white" : "text-slate-600 dark:text-slate-400"}`}>
                {m === "login" ? "Log In" : "Sign Up"}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 16 : -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {mode === "signup" && (
                <>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-4 top-[42px] text-slate-500" />
                    <Input
                        label="Username"
                        placeholder="aaravk"
                        required
                        className="pl-10"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-4 top-[42px] text-slate-500" />
                    <Input
                        label="Professional Title"
                        placeholder="Full-Stack Developer"
                        className="pl-10"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-4 top-[42px] text-slate-500" />
                    <Input
                        label="Location"
                        placeholder="Bengaluru, India"
                        className="pl-10"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-[42px] text-slate-500" />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-[42px] text-slate-500" />
                <Input
                    label="Password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-4 top-[42px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              disabled={loading}
          >
              {loading
                  ? "Please wait..."
                  : mode === "login"
                      ? "Log In"
                      : "Create Account"}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-slate-900/10 dark:bg-white/10" />
          <span className="text-xs text-slate-500 dark:text-slate-400">or continue with</span>
          <div className="h-px flex-1 bg-slate-900/10 dark:bg-white/10" />
        </div>

        <Button
          type="button"
          variant="glass"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setGithubModalOpen(true)}
        >
          <GithubIcon className="w-4 h-4" />
          Continue with GitHub
        </Button>
      </GlassCard>

      <GithubAuthModal
        open={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        mode="auth"
        onSuccess={(data) => {
          if (data.user) {
            loginWithGithub(data.user);
            navigate("/feed");
          }
        }}
      />
    </PageTransition>
  );
}
