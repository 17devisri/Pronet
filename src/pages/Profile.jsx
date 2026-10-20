import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin,
  Code2,
  Users2,
  FolderGit2,
  Activity,
  CheckCircle2,
  Edit3,
  Save,
  PlusCircle,
  Inbox,
  Star,
  GitFork,
  ExternalLink
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import { TechPill } from "../components/Pill";
import Modal from "../components/Modal";
import EditProjectModal from "../components/EditProjectModal";
import { Input } from "../components/Input";
import { useToast } from "../components/Toast";
import PageTransition, { staggerContainer, staggerItem } from "../components/PageTransition";
import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

const statCards = [
  { icon: FolderGit2, key: "projects", label: "Projects Posted" },
  { icon: Users2, key: "connections", label: "Connections" },
  { icon: Activity, key: "contributions", label: "Contributions" },
  { icon: CheckCircle2, key: "requestsAccepted", label: "Requests Accepted" },
];

export default function Profile() {
  const { user: authUser, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(authUser);
  const [projects, setProjects] = useState([]);
  const [contributionsData, setContributionsData] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [projectsTab, setProjectsTab] = useState("posted"); // "posted", "contributed", or "forked"
  const [forkedProjects, setForkedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    location: "",
    github_url: "",
    bio: "",
    skills: "",
  });

  // Project Edit Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const currentUsername = authUser?.user_name || "aaravk";

  useEffect(() => {
    if (!currentUsername) return;

    // 1. Fetch real user profile from DB
    fetch(`${API_BASE_URL}/api/users/${currentUsername}`)
      .then((res) => {
        if (!res.ok) throw new Error("User not found");
        return res.json();
      })
      .then((data) => {
        if (data && data.user_name) {
          setProfileData(data);
          updateUser(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch user profile from DB", err);
      });

    // 2. Fetch real projects owned by this user from DB
    fetch(`${API_BASE_URL}/api/users/${currentUsername}/projects`)
      .then((res) => {
        if (!res.ok) throw new Error("Projects fetch error");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          setProjects([]);
        }
      })
      .catch(() => {
        setProjects([]);
      })
      .finally(() => {
        setLoading(false);
      });

    // 3. Fetch real contributions from DB
    fetch(`${API_BASE_URL}/api/users/${currentUsername}/contributions`)
      .then((res) => {
        if (!res.ok) throw new Error("Contributions fetch error");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setContributionsData(data);
          if (Array.isArray(data.contributions)) {
            setContributions(data.contributions);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch user contributions from DB", err);
      });

    // 4. Fetch real forked projects from DB
    fetch(`${API_BASE_URL}/api/users/${currentUsername}/forks`)
      .then((res) => {
        if (!res.ok) throw new Error("Forks fetch error");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setForkedProjects(data);
        } else {
          setForkedProjects([]);
        }
      })
      .catch(() => {
        setForkedProjects([]);
      });
  }, [currentUsername]);

  const user = profileData || authUser;
  const displayName = user?.user_name || currentUsername;
  const displayEmail = user?.email || `${currentUsername}@example.com`;
  const avatarUrl =
    user?.avatar ||
    `https://api.dicebear.com/9.x/notionists/svg?seed=${currentUsername}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  const locationText = user?.location || "Location not specified";
  const githubText = user?.github_url || currentUsername;
  const bioText = user?.bio || "No bio yet. Click 'Edit Profile' to add your bio.";

  const totalContributions =
    contributionsData?.total_contributions ??
    (user?.stats?.contributions !== undefined && user.stats.contributions !== null
      ? user.stats.contributions
      : contributions.length);

  const statsData = {
    projects: projects.length,
    connections: user?.stats?.connections ?? (contributionsData?.stats?.connections ?? 0),
    contributions: totalContributions,
    requestsAccepted: user?.stats?.requestsAccepted ?? (contributionsData?.stats?.requestsAccepted ?? 0),
  };

  const skillsList = Array.isArray(user?.skills) && user.skills.length > 0 ? user.skills : [];

  const handleOpenEdit = () => {
    setEditForm({
      title: user?.title || "",
      location: user?.location || "",
      github_url: user?.github_url || "",
      bio: user?.bio || "",
      skills: Array.isArray(user?.skills) ? user.skills.join(", ") : "",
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const skillsArray = editForm.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUsername}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          location: editForm.location,
          github_url: editForm.github_url,
          bio: editForm.bio,
          skills: skillsArray,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updatedData = await res.json();
      setProfileData((prev) => ({ ...prev, ...updatedData }));
      updateUser(updatedData);

      showToast("Profile updated in database!", "success");
      setEditModalOpen(false);
    } catch (err) {
      showToast("Failed to save changes to database", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="max-w-5xl mx-auto px-6 py-10">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
        <GlassCard variants={staggerItem} variant="strong" className="p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar src={avatarUrl} online size="xl" ring />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{displayName}</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                <span className="font-medium text-indigo-500 dark:text-indigo-400">
                  {user?.title || "Developer"}
                </span>{" "}
                · {displayEmail}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {locationText}
                </span>
                <span className="flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" />
                  {githubText}
                </span>
              </div>
            </div>
            <Button variant="glass" onClick={handleOpenEdit}>
              <Edit3 className="w-4 h-4" /> Edit Profile
            </Button>
          </div>
          <p className="relative text-sm text-slate-700 dark:text-slate-300 mt-6 leading-relaxed max-w-2xl">
            {bioText}
          </p>
        </GlassCard>

        {/* Real Stats Grid */}
        <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map(({ icon: Icon, key, label }) => (
            <GlassCard key={key} className="p-5 text-center" hover>
              <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{statsData[key]}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </GlassCard>
          ))}
        </motion.div>

        {/* Skills from Database */}
        <GlassCard variants={staggerItem} className="p-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Skills</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {skillsList.length} technologies listed
            </span>
          </div>
          {skillsList.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No skills added yet. Click &quot;Edit Profile&quot; to add your technical skills.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skillsList.map((s) => (
                <TechPill key={s} label={s} />
              ))}
            </div>
          )}
        </GlassCard>


        {/* Real Projects & Contributions Tabbed Section */}
        <GlassCard variants={staggerItem} className="p-7">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            {/* Tab Switcher: Posted vs Contributed */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/10 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setProjectsTab("posted")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  projectsTab === "posted"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" /> Posted Projects ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setProjectsTab("contributed")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  projectsTab === "contributed"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Users2 className="w-3.5 h-3.5" /> Contributed Projects ({contributions.length})
              </button>
              <button
                type="button"
                onClick={() => setProjectsTab("forked")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  projectsTab === "forked"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <GitFork className="w-3.5 h-3.5" /> Forked Projects ({forkedProjects.length})
              </button>
            </div>

            {projectsTab === "posted" ? (
              <Link to="/create">
                <Button size="xs" variant="glass">
                  <PlusCircle className="w-3.5 h-3.5" /> New Project
                </Button>
              </Link>
            ) : (
              <Link to="/feed">
                <Button size="xs" variant="glass">
                  <ExternalLink className="w-3.5 h-3.5" /> Explore Projects
                </Button>
              </Link>
            )}
          </div>

          {/* TAB 1: Posted Projects */}
          {projectsTab === "posted" && (
            <>
              {projects.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-700/50 rounded-2xl">
                  <Inbox className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 mb-3">You haven&apos;t posted any projects yet.</p>
                  <Link to="/create">
                    <Button size="sm" variant="primary">
                      Publish Your First Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 hover:border-indigo-400/30 hover:bg-slate-900/8 dark:hover:bg-white/8 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <Link
                            to={`/project/${p.id}`}
                            className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-400 transition-colors line-clamp-1"
                          >
                            {p.title}
                          </Link>
                          <Button
                            size="xs"
                            variant="glass"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingProject(p);
                              setProjectModalOpen(true);
                            }}
                            className="shrink-0 flex items-center gap-1 py-0.5 px-2 text-[11px]"
                          >
                            <Edit3 className="w-3 h-3 text-indigo-400" /> Edit
                          </Button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{p.tagline}</p>

                        {Array.isArray(p.tech) && p.tech.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {p.tech.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900/5 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500/30" /> {p.stars ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <GitFork className="w-3 h-3 text-indigo-400" /> {p.forks ?? 0}
                          </span>
                        </div>
                        <Link
                          to={`/project/${p.id}`}
                          className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: Contributed Projects (Real database 'contributers' table) */}
          {projectsTab === "contributed" && (
            <>
              {contributions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-700/50 rounded-2xl">
                  <Users2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 mb-1">No project contributions found.</p>
                  <p className="text-xs text-slate-500 mb-4">Request to collaborate on open projects to start contributing!</p>
                  <Link to="/feed">
                    <Button size="sm" variant="primary">
                      Explore Open Projects
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {contributions.map((c) => (
                    <div
                      key={c.id}
                      className="p-5 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 hover:border-indigo-400/30 hover:bg-slate-900/8 dark:hover:bg-white/8 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
                          <Link
                            to={`/project/${c.project.id}`}
                            className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-400 transition-colors line-clamp-1"
                          >
                            {c.project.title}
                          </Link>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                            {c.role || "Contributor"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                          <Avatar src={c.project.owner?.avatar} size="xs" />
                          <span>
                            Owned by <strong className="text-slate-700 dark:text-slate-300">@{c.project.owner?.user_name}</strong>
                          </span>
                          {c.joined_at && (
                            <>
                              <span>·</span>
                              <span className="text-[11px]">
                                Joined {new Date(c.joined_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{c.project.tagline}</p>

                        {Array.isArray(c.project.tech) && c.project.tech.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {c.project.tech.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900/5 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500/30" /> {c.project.stars ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <GitFork className="w-3 h-3 text-indigo-400" /> {c.project.forks ?? 0}
                          </span>
                        </div>
                        <Link
                          to={`/project/${c.project.id}`}
                          className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          View Project &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 3: Forked Projects */}
          {projectsTab === "forked" && (
            <>
              {forkedProjects.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-700/50 rounded-2xl">
                  <GitFork className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 mb-1">No forked projects found.</p>
                  <p className="text-xs text-slate-500 mb-4">Explore projects in the feed and fork them to your workspace!</p>
                  <Link to="/feed">
                    <Button size="sm" variant="primary">
                      Explore Projects to Fork
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {forkedProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 hover:border-indigo-400/30 hover:bg-slate-900/8 dark:hover:bg-white/8 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
                          <Link
                            to={`/project/${p.id}`}
                            className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-400 transition-colors line-clamp-1 text-base"
                          >
                            {p.title}
                          </Link>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25 shrink-0 flex items-center gap-1">
                            <GitFork className="w-3 h-3" /> Forked
                          </span>
                        </div>

                        {p.owner && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                            <Avatar src={p.owner.avatar} size="xs" />
                            <span>
                              Originally by <strong className="text-slate-700 dark:text-slate-300">@{p.owner.user_name}</strong>
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{p.tagline || p.description}</p>

                        {Array.isArray(p.tech) && p.tech.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {p.tech.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-900/10 dark:border-white/10 text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {p.stars ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3 h-3 text-indigo-400" /> {p.forks ?? 0}
                          </span>
                        </div>
                        <Link
                          to={`/project/${p.id}`}
                          className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          View Project &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </GlassCard>
      </motion.div>

      {/* Edit Profile Interactive Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          <Input
            label="Professional Title"
            placeholder="e.g. Full-Stack Developer · DBMS Specialist"
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            label="Location"
            placeholder="e.g. Bengaluru, India"
            value={editForm.location}
            onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
          />
          <Input
            label="GitHub Profile / Handle"
            placeholder="e.g. yourhandle"
            value={editForm.github_url}
            onChange={(e) => setEditForm((f) => ({ ...f, github_url: e.target.value }))}
          />
          <Input
            label="Skills (comma separated)"
            placeholder="React, Node.js, Python, PostgreSQL, Docker"
            value={editForm.skills}
            onChange={(e) => setEditForm((f) => ({ ...f, skills: e.target.value }))}
          />
          <Input
            textarea
            label="Bio"
            placeholder="Tell the community about yourself and what you love building..."
            value={editForm.bio}
            onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Project Interactive Modal */}
      <EditProjectModal
        project={editingProject}
        open={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onProjectUpdated={(updated) => {
          setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
        onProjectDeleted={(deletedId) => {
          setProjects((prev) => prev.filter((p) => p.id !== deletedId));
        }}
      />
    </PageTransition>
  );
}
