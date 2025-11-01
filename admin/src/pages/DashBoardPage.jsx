// ...existing code...
import React, { useState, useEffect, useMemo, useCallback } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";

import { getAllPosts, getAllUsers } from "@/lib/api";

/* Utilities */
const formatCompact = (n) => {
  if (n == null) return "0";
  try {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  } catch {
    return String(n);
  }
};
const formatNumber = (n) => (n == null ? "0" : new Intl.NumberFormat().format(n));
const safeDate = (d) => {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};

/* Small UI bits */
function IconDot({ variant = "light" }) {
  const map = {
    pink: "bg-gradient-to-tr from-pink-200 to-pink-400 text-white",
    yellow: "bg-gradient-to-tr from-yellow-100 to-yellow-300 text-amber-800",
    green: "bg-gradient-to-tr from-emerald-100 to-emerald-300 text-emerald-800",
    purple: "bg-gradient-to-tr from-violet-100 to-violet-300 text-violet-800",
    light: "bg-slate-100 text-sky-600",
  };
  return <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${map[variant] || map.light}`}>●</div>;
}

function Card({ title, value, subtitle, variant }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-lg transition-shadow">
      <IconDot variant={variant} />
      <div className="flex-1">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        {subtitle && <div className="text-sm mt-1 text-slate-500">{subtitle}</div>}
      </div>
    </div>
  );
}

function SmallSkeleton() {
  return <div className="animate-pulse bg-slate-200 h-6 rounded w-full" />;
}

/* Custom tooltip to look nicer */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white p-2 rounded shadow text-sm">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div style={{ width: 10, height: 10, background: p.color || "#000", borderRadius: 2 }} />
          <div className="text-slate-700">{p.name}: <span className="font-semibold">{formatNumber(p.value)}</span></div>
        </div>
      ))}
    </div>
  );
}

/* Main */
export default function DashBoardPage() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeDays, setRangeDays] = useState(7);
  const [polling, setPolling] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, pRes] = await Promise.all([getAllUsers(), getAllPosts()]);
      setUsers(Array.isArray(uRes?.data) ? uRes.data : []);
      setPosts(Array.isArray(pRes?.data) ? pRes.data : []);
    } catch (err) {
      console.error("Dashboard fetch error", err);
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // optional polling toggle (refresh every 30s)
  useEffect(() => {
    if (!polling) return undefined;
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [polling, fetchAll]);

  // map user id -> display name (prefer username then email)
  const userMap = useMemo(() => {
   const m = new Map();
    users.forEach((u) => {
      const key = String(u?._id ?? u?.id ?? u?.userId ?? "");
      if (!key) return;
      // ensure we store a string (not whole user object)
      const name =
        typeof u === "string"
          ? u
          : (u?.username || u?.userId || u?.email || key);
      m.set(key, String(name));
    });
    return m;
  }, [users]);

  // Derived metrics memoized
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const totalPosts = posts.length;

    // new users last 7/30
    const since = (n) => {
      const cut = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
      return users.reduce((s, u) => {
        const d = safeDate(u.createdAt);
        return s + (d && d >= cut ? 1 : 0);
      }, 0);
    };
    const new7 = since(7);
    const new30 = since(30);

    // active users in chosen range: unique authors who posted
    const cutRange = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
    const activeAuthors = new Set();
    posts.forEach((p) => {
      const d = safeDate(p.createdAt);
      const uid = p.user?.toString ? p.user.toString() : p.user;
      if (d && d >= cutRange && uid) activeAuthors.add(String(uid));
    });
    const activeUsers = activeAuthors.size;

    // engagement averages
    const totalLikes = posts.reduce((s, p) => s + (p.likeCount || 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.commentCount || 0), 0);
    const avgLikes = posts.length ? +(totalLikes / posts.length).toFixed(1) : 0;
    const avgComments = posts.length ? +(totalComments / posts.length).toFixed(1) : 0;
    const avgPostsPerUser = totalUsers ? +(totalPosts / totalUsers).toFixed(2) : 0;

    // top posters by count (resolve names if possible)
    const counts = {};
    posts.forEach((p) => {
      const uid = p.user?.toString ? p.user.toString() : p.user;
      if (!uid) return;
      counts[uid] = (counts[uid] || 0) + 1;
    });
    
   const topPosters = Object.entries(counts)
     .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, count]) => ({ id, name: userMap.get(String(id)) || String(id), count }));

    // user status pie
    const banned = users.filter((u) => u.isBanned || u.is_blocked || u.status === "banned").length;
    const verified = users.filter((u) => u.isVerified || u.verified).length;
    const others = Math.max(0, totalUsers - banned - verified);
    console.log(topPosters)
    return {
      totalUsers,
      totalPosts,
      new7,
      new30,
      activeUsers,
      avgLikes,
      avgComments,
      avgPostsPerUser,
      topPosters,
      pie: [
        { name: "Verified", value: verified, color: "#6366F1" },
        { name: "Active", value: others, color: "#10B981" },
        { name: "Banned", value: banned, color: "#EF4444" },
      ],
    };
  }, [users, posts, rangeDays, userMap]);

  // charts data memoized
  const userGrowthSeries = useMemo(() => {
    const days = 7;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    const map = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      map.push({ dayKey: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }), users: 0 });
    }
    users.forEach((u) => {
      const d = safeDate(u.createdAt);
      if (!d) return;
      const key = d.toISOString().slice(0, 10);
      const item = map.find((m) => m.dayKey === key);
      if (item) item.users += 1;
    });
    return map.map(({ label, users }) => ({ day: label, users }));
  }, [users]);

  const postsMonthlySeries = useMemo(() => {
    const months = 6;
    const now = new Date();
    const map = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.push({ key, label: d.toLocaleString("en-GB", { month: "short" }), posts: 0 });
    }
    posts.forEach((p) => {
      const d = safeDate(p.createdAt);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const item = map.find((m) => m.key === key);
      if (item) item.posts += 1;
    });
    return map.map(({ label, posts }) => ({ month: label, posts }));
  }, [posts]);

  // CSV export (compact & safe)
  const exportCSV = useCallback(() => {
    const rows = [
      ["Metric", "Value"],
      ["Total users", metrics.totalUsers],
      ["Total posts", metrics.totalPosts],
      ["New users (7d)", metrics.new7],
      ["New users (30d)", metrics.new30],
      ["Active users (range)", metrics.activeUsers],
      ["Avg posts/user", metrics.avgPostsPerUser],
      ["Avg likes/post", metrics.avgLikes],
      ["Avg comments/post", metrics.avgComments],
      [],
      ["Month", "Posts"],
      ...postsMonthlySeries.map((m) => [m.month, m.posts]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, postsMonthlySeries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
              <div className="text-sm text-slate-500">Loading analytics…</div>
            </div>
            <div className="flex gap-2">
              <button className="bg-white px-3 py-2 rounded shadow">Export</button>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <SmallSkeleton />
                <div className="mt-3">
                  <SmallSkeleton />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <div className="text-sm text-slate-500">Real data analytics — improved charts</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm gap-2">
              <label className="text-sm text-slate-600">Range</label>
              <select value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))} className="text-sm outline-none">
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            <button onClick={fetchAll} className="bg-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md">
              Refresh
            </button>

            <button onClick={() => setPolling((s) => !s)} className={`px-3 py-2 rounded-lg ${polling ? "bg-emerald-100" : "bg-white"} shadow-sm`}>
              {polling ? "Polling: ON" : "Polling: OFF"}
            </button>

            <button onClick={exportCSV} className="bg-white text-slate-700 px-3 py-2 rounded-lg shadow-sm hover:shadow-md">
              Export CSV
            </button>
          </div>
        </header>

        {error && <div className="mb-4 text-sm text-rose-600">{error}</div>}

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card title="Total users" value={formatCompact(metrics.totalUsers)} subtitle={`${metrics.new7} new (7d)`} variant="pink" />
          <Card title="Total posts" value={formatCompact(metrics.totalPosts)} subtitle={`Avg/post ${metrics.avgPostsPerUser}`} variant="yellow" />
          <Card title="Active users" value={formatCompact(metrics.activeUsers)} subtitle={`last ${rangeDays} days`} variant="green" />
          <Card title="Engagement avg" value={`${metrics.avgLikes}❤ / ${metrics.avgComments}💬`} subtitle="per post" variant="purple" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-800">User growth (last 7 days)</div>
              <div className="text-sm text-slate-500">Trend of new signups</div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthSeries} margin={{ left: -12, right: 6 }}>
                  <defs>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="users" stroke="#2563EB" fill="url(#gUsers)" fillOpacity={1} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="users" stroke="#1D4ED8" strokeWidth={2.2} dot={{ r: 3, stroke: "#fff", strokeWidth: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-800">Users status</div>
              <div className="text-sm text-slate-500">verified / active / banned</div>
            </div>
            <div className="flex gap-4 items-center h-52">
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Legend verticalAlign="top" height={24} />
                    <Pie
                      data={metrics.pie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={34}
                      outerRadius={72}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {metrics.pie.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} stroke="#fff" strokeWidth={1} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-36">
                {metrics.pie.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                    <span className="w-3 h-3 rounded-sm" style={{ background: p.color }} />
                    <span className="flex-1">{p.name}</span>
                    <span className="font-semibold text-slate-800">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-800">Posts last 6 months</div>
              <div className="text-sm text-slate-500">Monthly volume</div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postsMonthlySeries} margin={{ left: -12, right: 6 }}>
                  <defs>
                    <linearGradient id="gPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="posts" fill="url(#gPosts)" radius={[8, 8, 6, 6]}>
                    <LabelList dataKey="posts" position="top" formatter={(v) => (v ? formatNumber(v) : "")} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

         
        </section>
      </div>
    </div>
  );
}
