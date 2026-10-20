import { useState, useMemo, useEffect } from "react";
import { X, Save, Trash2, Plus } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { Input } from "./Input";
import { TechPill } from "./Pill";
import { skillSuggestions } from "../data/mock";
import { useToast } from "./Toast";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

export default function EditProjectModal({ project, open, onClose, onProjectUpdated, onProjectDeleted }) {
  const { user } = useAuth();
  const showToast = useToast();

  const [title, setTitle] = useState(project?.title || "");
  const [tagline, setTagline] = useState(project?.tagline || "");
  const [description, setDescription] = useState(project?.description || "");
  const [github, setGithub] = useState(project?.github || "");
  const [techList, setTechList] = useState(Array.isArray(project?.tech) ? project.tech : []);
  const [techInput, setTechInput] = useState("");
  const [roles, setRoles] = useState(
    Array.isArray(project?.roles_needed)
      ? project.roles_needed
      : Array.isArray(project?.rolesNeeded)
      ? project.rolesNeeded
      : []
  );
  const [roleInput, setRoleInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title || "");
      setTagline(project.tagline || "");
      setDescription(project.description || "");
      setGithub(project.github || "");
      setTechList(Array.isArray(project.tech) ? project.tech : []);
      setRoles(
        Array.isArray(project.roles_needed)
          ? project.roles_needed
          : Array.isArray(project.rolesNeeded)
          ? project.rolesNeeded
          : []
      );
    }
  }, [project]);

  if (!project) return null;

  const suggestions = useMemo(
    () =>
      skillSuggestions.filter(
        (s) => s.toLowerCase().includes(techInput.toLowerCase()) && !techList.includes(s) && techInput
      ),
    [techInput, techList]
  );

  const addTech = (skill) => {
    if (!skill || techList.includes(skill)) return;
    setTechList([...techList, skill]);
    setTechInput("");
  };

  const removeTech = (skill) => {
    setTechList(techList.filter((t) => t !== skill));
  };

  const addRole = () => {
    if (!roleInput.trim() || roles.includes(roleInput.trim())) return;
    setRoles([...roles, roleInput.trim()]);
    setRoleInput("");
  };

  const removeRole = (role) => {
    setRoles(roles.filter((r) => r !== role));
  };

  const handleSave = async () => {
    if (!title.trim() || !tagline.trim()) {
      showToast("Title and tagline are required", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          tagline,
          description,
          github,
          tech: techList,
          roles: roles,
          user_name: user?.user_name || project.owner?.user_name || "aaravk",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update project");
      }

      const updated = await res.json();
      showToast("Project updated successfully!", "success");
      onProjectUpdated?.(updated);
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to update project", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project.title}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${project.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: user?.user_name || project.owner?.user_name || "aaravk" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete project");
      }

      showToast("Project deleted successfully", "success");
      onProjectDeleted?.(project.id);
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to delete project", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Project">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <Input
          label="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. PulseDB"
          required
        />

        <Input
          label="Tagline (Pitch)"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="A blazing-fast realtime database..."
          required
        />

        <Input
          textarea
          label="Full Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the community what you are building and why..."
          rows={4}
        />

        <Input
          label="GitHub Repository URL"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          placeholder="https://github.com/yourhandle/project"
        />

        {/* Tech Stack */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
            Tech Stack
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add technology (e.g. React, PostgreSQL)..."
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTech(techInput.trim());
                }
              }}
              className="flex-1"
            />
            <Button size="sm" type="button" onClick={() => addTech(techInput.trim())}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {suggestions.slice(0, 5).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTech(s)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {techList.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-slate-900/5 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-900/10 dark:border-white/10"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTech(t)}
                  className="hover:text-rose-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Roles Needed */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
            Roles Needed
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="e.g. Frontend Dev, DevOps Engineer..."
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRole();
                }
              }}
              className="flex-1"
            />
            <Button size="sm" type="button" onClick={addRole}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20"
              >
                {r}
                <button
                  type="button"
                  onClick={() => removeRole(r)}
                  className="hover:text-rose-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-900/10 dark:border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete Project"}
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
