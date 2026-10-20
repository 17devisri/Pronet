import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Sparkles, Star, GitFork, Check, ArrowDownUp } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import { ProjectCardSkeleton } from "../components/Skeleton";
import CollaborateModal from "../components/CollaborateModal";
import PageTransition, { staggerContainer } from "../components/PageTransition";
import { Input } from "../components/Input";
import Button from "../components/Button";
import GlassCard from "../components/GlassCard";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

export default function Feed() {
  const { isAuthenticated } = useAuth();
  const [feedProjects, setFeedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTech, setActiveTech] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // "newest", "stars", "forks"
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [modalProject, setModalProject] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/projects`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setFeedProjects(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Extract all distinct tech skills
  const allTech = useMemo(() => {
    return [...new Set(feedProjects.flatMap((p) => (Array.isArray(p.tech) ? p.tech : [])))];
  }, [feedProjects]);

  // Extract all distinct roles needed
  const allRoles = useMemo(() => {
    return [
      ...new Set(
        feedProjects.flatMap((p) => {
          const roles = Array.isArray(p.roles_needed)
            ? p.roles_needed
            : Array.isArray(p.rolesNeeded)
            ? p.rolesNeeded
            : [];
          return roles;
        })
      ),
    ];
  }, [feedProjects]);

  const activeFilterCount = (activeTech ? 1 : 0) + (selectedRole ? 1 : 0) + (sortBy !== "newest" ? 1 : 0);

  const clearAllFilters = () => {
    setActiveTech(null);
    setSelectedRole(null);
    setSortBy("newest");
    setQuery("");
  };

  // Filter & Sort
  const filtered = useMemo(() => {
    let result = feedProjects.filter((p) => {
      const matchesQuery =
        !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.tagline.toLowerCase().includes(query.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(query.toLowerCase()));

      const matchesTech = !activeTech || (Array.isArray(p.tech) && p.tech.includes(activeTech));

      const pRoles = Array.isArray(p.roles_needed)
        ? p.roles_needed
        : Array.isArray(p.rolesNeeded)
        ? p.rolesNeeded
        : [];
      const matchesRole = !selectedRole || pRoles.includes(selectedRole);

      return matchesQuery && matchesTech && matchesRole;
    });

    if (sortBy === "stars") {
      result.sort((a, b) => (b.stars || 0) - (a.stars || 0));
    } else if (sortBy === "forks") {
      result.sort((a, b) => (b.forks || 0) - (a.forks || 0));
    }

    return result;
  }, [feedProjects, query, activeTech, selectedRole, sortBy]);

  return (
    <PageTransition className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Explore Projects</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Discover what developers are building, filter by tech & roles, and join your next collaboration.
        </p>
      </div>

      {/* Search & Filter Trigger Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Search by project name, description, or keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setFilterPanelOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium border transition-all ${
            filterPanelOpen || activeFilterCount > 0
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/10"
              : "bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-white/10"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {filterPanelOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            className="overflow-hidden mb-6"
          >
            <GlassCard className="p-5 sm:p-6 space-y-5 border border-indigo-500/20">
              <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> Refine Projects
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                  >
                    Reset all filters
                  </button>
                )}
              </div>

              {/* Roles Needed Filter */}
              {allRoles.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 block">
                    Roles Needed
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedRole(null)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        !selectedRole
                          ? "bg-violet-500/20 border-violet-400/40 text-violet-700 dark:text-violet-300 font-semibold"
                          : "border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Any Role
                    </button>
                    {allRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role === selectedRole ? null : role)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                          selectedRole === role
                            ? "bg-violet-500/20 border-violet-400/40 text-violet-700 dark:text-violet-300 font-semibold"
                            : "border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort By Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 block">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSortBy("newest")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      sortBy === "newest"
                        ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <ArrowDownUp className="w-3.5 h-3.5" /> Recently Added
                  </button>
                  <button
                    onClick={() => setSortBy("stars")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      sortBy === "stars"
                        ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" /> Most Stars
                  </button>
                  <button
                    onClick={() => setSortBy("forks")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      sortBy === "forks"
                        ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <GitFork className="w-3.5 h-3.5" /> Most Forks
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tech Stack Chips Quick Scroll */}
      <div className="flex flex-wrap gap-2 mb-8">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setActiveTech(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !activeTech
              ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-700 dark:text-indigo-300"
              : "border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          All Tech
        </motion.button>
        {allTech.map((t) => (
          <motion.button
            key={t}
            whileTap={{ scale: 0.94 }}
            onClick={() => setActiveTech(t === activeTech ? null : t)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeTech === t
                ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-700 dark:text-indigo-300"
                : "border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t}
          </motion.button>
        ))}
      </div>

      {/* Active Filter Tags Indicator */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6 text-xs text-slate-500 dark:text-slate-400">
          <span>Active filters:</span>
          {activeTech && (
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1">
              Tech: {activeTech}
              <button onClick={() => setActiveTech(null)}><X className="w-3 h-3 hover:text-indigo-700" /></button>
            </span>
          )}
          {selectedRole && (
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-500 border border-violet-500/20 flex items-center gap-1">
              Role: {selectedRole}
              <button onClick={() => setSelectedRole(null)}><X className="w-3 h-3 hover:text-violet-700" /></button>
            </span>
          )}
          {sortBy !== "newest" && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/10 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-900/10 dark:border-white/10 flex items-center gap-1">
              Sort: {sortBy}
              <button onClick={() => setSortBy("newest")}><X className="w-3 h-3" /></button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-rose-500 hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : feedProjects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-700/40 rounded-3xl">
          <p className="text-slate-500 dark:text-slate-400 mb-4">No projects posted yet. Be the first to publish a project!</p>
          <Link to={isAuthenticated ? "/create" : "/auth"}>
            <Button size="sm">Create Project</Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-700/40 rounded-3xl">
          <p className="text-slate-500 dark:text-slate-400 mb-3">No projects match your current filters.</p>
          <Button size="sm" variant="glass" onClick={clearAllFilters}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onCollaborate={setModalProject} />
          ))}
        </motion.div>
      )}

      <CollaborateModal project={modalProject} open={!!modalProject} onClose={() => setModalProject(null)} />
    </PageTransition>
  );
}
