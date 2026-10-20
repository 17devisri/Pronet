const AV = (seed) => `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

export const currentUser = {
  id: "u1",
  name: "Aarav Kapoor",
  handle: "@aaravk",
  avatar: AV("aarav"),
  online: true,
  title: "Full-Stack Developer · DBMS Enthusiast",
  bio: "Building developer tools by day, breaking them by night. Into distributed systems, Postgres internals, and clean UI.",
  location: "Bengaluru, India",
  skills: ["React", "Node.js", "PostgreSQL", "Python", "Docker", "System Design", "TypeScript", "GraphQL"],
  stats: { projects: 12, connections: 348, contributions: 1204, requestsAccepted: 27 },
  github: "aaravk",
};

export const users = [
  currentUser,
  { id: "u2", name: "Meera Iyer", handle: "@meerai", avatar: AV("meera"), online: true, title: "ML Engineer" },
  { id: "u3", name: "Rohan Verma", handle: "@rohanv", avatar: AV("rohan"), online: false, title: "Backend Engineer" },
  { id: "u4", name: "Sara Chen", handle: "@sarac", avatar: AV("sara"), online: true, title: "Product Designer" },
  { id: "u5", name: "Devika Nair", handle: "@devikan", avatar: AV("devika"), online: false, title: "Mobile Developer" },
  { id: "u6", name: "Kabir Malhotra", handle: "@kabirm", avatar: AV("kabir"), online: true, title: "DevOps Engineer" },
  { id: "u7", name: "Ishaan Rao", handle: "@ishaanr", avatar: AV("ishaan"), online: false, title: "Frontend Engineer" },
  { id: "u8", name: "Ananya Gupta", handle: "@ananyag", avatar: AV("ananya"), online: true, title: "Data Scientist" },
];

export const techColors = {
  React: "from-cyan-400/20 to-cyan-400/5 text-cyan-700 dark:text-cyan-300 border-cyan-400/30",
  "Node.js": "from-emerald-400/20 to-emerald-400/5 text-emerald-700 dark:text-emerald-300 border-emerald-400/30",
  PostgreSQL: "from-blue-400/20 to-blue-400/5 text-blue-700 dark:text-blue-300 border-blue-400/30",
  Python: "from-yellow-400/20 to-yellow-400/5 text-yellow-700 dark:text-yellow-300 border-yellow-400/30",
  Docker: "from-sky-400/20 to-sky-400/5 text-sky-700 dark:text-sky-300 border-sky-400/30",
  TypeScript: "from-indigo-400/20 to-indigo-400/5 text-indigo-700 dark:text-indigo-300 border-indigo-400/30",
  GraphQL: "from-pink-400/20 to-pink-400/5 text-pink-700 dark:text-pink-300 border-pink-400/30",
  "System Design": "from-violet-400/20 to-violet-400/5 text-violet-700 dark:text-violet-300 border-violet-400/30",
  "Next.js": "from-slate-300/20 to-slate-300/5 text-slate-700 dark:text-slate-300 border-slate-300/30",
  TailwindCSS: "from-teal-400/20 to-teal-400/5 text-teal-700 dark:text-teal-300 border-teal-400/30",
  Redis: "from-red-400/20 to-red-400/5 text-red-700 dark:text-red-300 border-red-400/30",
  "Vue.js": "from-green-400/20 to-green-400/5 text-green-700 dark:text-green-300 border-green-400/30",
  Rust: "from-orange-400/20 to-orange-400/5 text-orange-700 dark:text-orange-300 border-orange-400/30",
  Kubernetes: "from-blue-500/20 to-blue-500/5 text-blue-700 dark:text-blue-300 border-blue-500/30",
  default: "from-fuchsia-400/20 to-fuchsia-400/5 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-400/30",
};

export const projects = [];

export const collabRequests = [];

export const connections = users.slice(1);

export const skillSuggestions = [
  "React", "Node.js", "PostgreSQL", "Python", "Docker", "TypeScript", "GraphQL",
  "Next.js", "TailwindCSS", "Redis", "Vue.js", "Rust", "Kubernetes", "MongoDB",
  "System Design", "Go", "Swift", "Kotlin", "AWS", "Firebase",
];
