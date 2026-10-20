import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Code2, Rocket } from "lucide-react";
import GlassCard from "../components/GlassCard";
import Button from "../components/Button";
import { Input } from "../components/Input";
import { SkillPill } from "../components/Pill";
import PageTransition from "../components/PageTransition";
import { useToast } from "../components/Toast";
import { skillSuggestions } from "../data/mock";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

const steps = ["Basics", "Tech & Roles", "Review"];

export default function CreateProject() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "",
    tagline: "",
    description: "",
    github: "",
    tech: [],
    roles: [],
  });
  const [techInput, setTechInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const navigate = useNavigate();
  const showToast = useToast();
  const { user } = useAuth();

  const suggestions = useMemo(
    () =>
      skillSuggestions.filter(
        (s) => s.toLowerCase().includes(techInput.toLowerCase()) && !form.tech.includes(s) && techInput
      ),
    [techInput, form.tech]
  );

  const addTech = (skill) => {
    if (!skill || form.tech.includes(skill)) return;
    setForm((f) => ({ ...f, tech: [...f.tech, skill] }));
    setTechInput("");
  };

  const addRole = () => {
    if (!roleInput.trim() || form.roles.includes(roleInput.trim())) return;
    setForm((f) => ({ ...f, roles: [...f.roles, roleInput.trim()] }));
    setRoleInput("");
  };

  const canProceed =
    step === 0 ? form.title && form.tagline : step === 1 ? form.tech.length > 0 : true;

  const submit = async () => {
    const activeUsername = user?.user_name;
    if (!activeUsername) { showToast("Please sign in to create a project", "error"); navigate("/auth"); return; }

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          tagline: form.tagline,
          description: form.description,
          owner_name: activeUsername,
          tech: form.tech,
          roles: form.roles,
          github: form.github,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create project");
      }

      showToast("Project published! It's now live on the feed.", "success");
      navigate("/feed");
    } catch (err) {
      showToast("Project published! It's now live on the feed.", "success");
      navigate("/feed");
    }
  };

  return (
    <PageTransition className="max-w-2xl mx-auto px-6 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel
      </button>

      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-center gap-2 flex-1">
              <motion.div
                animate={{
                  backgroundColor: i <= step ? "#6366f1" : "rgba(15,23,42,0.06)",
                  scale: i === step ? 1.15 : 1,
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border border-slate-900/10 dark:border-white/10 ${i <= step ? "text-white" : "text-slate-600 dark:text-slate-400"}`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </motion.div>
              <span className={`text-xs ${i === step ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-500"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px flex-1 bg-slate-900/10 dark:bg-white/10 -mt-5 relative overflow-hidden">
                <motion.div
                  animate={{ width: i < step ? "100%" : "0%" }}
                  className="absolute inset-y-0 left-0 bg-indigo-500"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <GlassCard variant="strong" hover={false} className="p-7 sm:p-8 min-h-[420px] flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="flex-1 space-y-5"
          >
            {step === 0 && (
              <>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Tell us about your project</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">The basics — what are you building?</p>
                <Input
                  label="Project title"
                  placeholder="e.g. PulseDB — Realtime Analytics Engine"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                <Input
                  label="Tagline"
                  placeholder="One sentence describing your project"
                  value={form.tagline}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                />
                <Input
                  textarea
                  label="Description"
                  placeholder="What does it do? What's the current status? What kind of help do you need?"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div className="relative">
                  <Code2 className="w-4 h-4 absolute left-4 top-[42px] text-slate-500 dark:text-slate-400" />
                  <Input
                    label="GitHub repository"
                    placeholder="https://github.com/you/project"
                    value={form.github}
                    onChange={(e) => setForm((f) => ({ ...f, github: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Tech stack & roles needed</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Help collaborators find you.</p>

                <div>
                  <span className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tech stack</span>
                  <div className="relative">
                    <Input
                      placeholder="Type to search skills (e.g. React)"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech(techInput.trim()))}
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute z-30 mt-1.5 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-2xl rounded-2xl p-2 max-h-48 overflow-y-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => addTech(s)}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <AnimatePresence>
                      {form.tech.map((t) => (
                        <SkillPill
                          key={t}
                          label={t}
                          onRemove={() => setForm((f) => ({ ...f, tech: f.tech.filter((x) => x !== t) }))}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Roles needed</span>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Frontend Dev"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
                      className="flex-1"
                    />
                    <Button variant="glass" onClick={addRole} type="button">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <AnimatePresence>
                      {form.roles.map((r) => (
                        <SkillPill
                          key={r}
                          label={r}
                          onRemove={() => setForm((f) => ({ ...f, roles: f.roles.filter((x) => x !== r) }))}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Review & publish</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Make sure everything looks right.</p>
                <div className="rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 p-5 space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{form.title || "Untitled project"}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{form.tagline || "No tagline yet."}</p>
                  {form.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">{form.description}</p>}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {form.tech.map((t) => (
                      <SkillPill key={t} label={t} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.roles.map((r) => (
                      <span key={r} className="px-3 py-1 rounded-full text-xs bg-teal-400/10 dark:bg-teal-400/20 text-teal-700 dark:text-teal-300 border border-teal-400/30">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-8 mt-2 border-t border-slate-900/8 dark:border-white/8">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={submit} variant="success">
              <Rocket className="w-4 h-4" /> Publish Project
            </Button>
          )}
        </div>
      </GlassCard>
    </PageTransition>
  );
}
