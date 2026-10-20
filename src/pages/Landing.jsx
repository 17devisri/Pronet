import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Braces, Users2, FolderGit2, MessageSquare, ArrowRight, Sparkles, Star, GitFork } from "lucide-react";
import Button from "../components/Button";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import { TechPill } from "../components/Pill";
import PageTransition, { staggerContainer, staggerItem } from "../components/PageTransition";
import { useEffect, useState } from "react";
import { users } from "../data/mock";
import { API_BASE_URL } from "../config/api";

const features = [
  {
    icon: FolderGit2,
    title: "Showcase Real Projects",
    desc: "Post what you're building with tech stacks, GitHub links, and open roles — not just a resume line.",
  },
  {
    icon: Users2,
    title: "Find Collaborators Fast",
    desc: "Match with developers by skill, availability, and interest. Send a request, start building together.",
  },
  {
    icon: MessageSquare,
    title: "Build in the Open",
    desc: "Comment, discuss, and iterate on projects publicly — like GitHub Discussions meets LinkedIn.",
  },
];

export default function Landing() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/projects`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setFeatured(data.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-28 max-w-6xl mx-auto text-center overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-40 -right-20 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-indigo-600 dark:text-indigo-300 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Where developers ship together
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="relative text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-6"
        >
          Network like LinkedIn.
          <br />
          <span className="text-gradient">Build like GitHub.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative max-w-xl mx-auto text-lg text-slate-600 dark:text-slate-400 mb-10"
        >
          Pronet is where developers post real projects, recruit collaborators,
          and grow their network around what they actually build.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="relative flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/auth">
            <Button size="lg">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/feed">
            <Button size="lg" variant="glass">
              Explore Projects
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative flex items-center justify-center gap-4 mt-14"
        >
          <div className="flex -space-x-3">
            {users.slice(1, 6).map((u) => (
              <Avatar key={u.id} src={u.avatar} size="sm" className="ring-2 ring-[#f8f9fd] dark:ring-[#0f1117]" />
            ))}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="text-slate-900 dark:text-white font-semibold">2,400+</span> developers already building
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-6xl mx-auto px-6 pb-28 grid sm:grid-cols-3 gap-6"
      >
        {features.map(({ icon: Icon, title, desc }) => (
          <GlassCard key={title} variants={staggerItem} className="p-7">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.1 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-400/20 flex items-center justify-center mb-5"
            >
              <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </motion.div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
          </GlassCard>
        ))}
      </motion.section>

      {/* Featured projects preview */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Trending on Pronet</h2>
            <p className="text-slate-600 dark:text-slate-400">Real projects looking for collaborators right now.</p>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid sm:grid-cols-3 gap-6"
          >
            {featured.map((p) => {
              const ownerName = p.owner?.name || p.owner?.user_name || "Developer";
              const ownerAvatar =
                p.owner?.avatar ||
                `https://api.dicebear.com/9.x/notionists/svg?seed=${ownerName}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
              const techList = Array.isArray(p.tech) ? p.tech : [];
              return (
                <Link to={`/project/${p.id}`} key={p.id}>
                  <GlassCard variants={staggerItem} className="p-6 h-full hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Avatar src={ownerAvatar} size="sm" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">{ownerName}</p>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{p.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">{p.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {techList.slice(0, 3).map((t) => (
                        <TechPill key={t} label={t} />
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{p.stars || 0}</span>
                      <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" />{p.forks || 0}</span>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </motion.div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-28">
        <GlassCard variant="strong" className="p-12 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-violet-600/20 blur-[100px]" />
          <Braces className="w-10 h-10 text-indigo-600 dark:text-indigo-300 mx-auto mb-5" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Ready to build something great?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
            Join thousands of developers posting projects, finding collaborators, and shipping together.
          </p>
          <Link to="/auth">
            <Button size="lg">
              Join Pronet <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </GlassCard>
      </section>
    </PageTransition>
  );
}
