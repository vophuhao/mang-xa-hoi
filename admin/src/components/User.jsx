// ...existing code...
import React, { useEffect, useMemo, useState, useCallback } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon,
  Users as UsersIcon,
  ShieldCheck,
  Search,
  XCircle,
  Ban,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";

import { getAllUsers } from "@/lib/api";

/* Small UI pieces */
const Badge = ({ children, color = "gray" }) => {
  const map = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-sky-50 text-sky-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
        map[color] || map.gray
      }`}
    >
      {children}
    </span>
  );
};

const Stat = ({ icon, label, value }) => (
  <div className="bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center text-slate-700">
      {icon}
    </div>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  </div>
);

/* Main improved Users UI */
export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | banned | verified
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null); // { action, id, label }

  // server pagination
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = useCallback(
    async ({ pageParam = page, qParam = q, filterParam = filter } = {}) => {
      setLoading(true);
      try {
        const res = await getAllUsers({
          page: pageParam,
          limit: perPage,
          q: qParam,
          filter: filterParam,
        });

        // support both shapes: { data: [...] , pagination } or { data: { data: [...], pagination } }
        const body = res?.data;
        const payload = body?.data ?? body;
        const items = Array.isArray(payload) ? payload : payload?.data || [];
        const pagination = Array.isArray(payload)
          ? body?.pagination
          : payload?.pagination || body?.pagination;

        // do not derive or use postsCount here — removed posts related logic
        const mapped = (items || []).map((u) => ({ ...u }));

        setUsers(mapped);
        if (pagination) {
          setTotal(pagination.total ?? mapped.length);
          setTotalPages(pagination.totalPages ?? pagination.total_pages ?? 1);
        } else {
          setTotal(mapped.length);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Load users failed", err);
        toast.error("Không tải được danh sách người dùng");
      } finally {
        setLoading(false);
      }
    },
    [page, q, filter, perPage]
  );

  useEffect(() => {
    loadUsers();
    // load when page/filter/q change
  }, [loadUsers, page, filter, q]);

  const stats = useMemo(() => {
    const totalLocal = users.length;
    const banned = users.filter((u) => u.isBanned).length;
    const verified = users.filter((u) => u.isVerified).length;
    return { total: totalLocal, banned, verified };
  }, [users]);

  const filtered = useMemo(() => {
    const qL = q.trim().toLowerCase();
    return users
      .filter((u) => {
        if (filter === "banned") return u.isBanned;
        if (filter === "verified") return u.isVerified;
        return true;
      })
      .filter((u) => {
        if (!qL) return true;
        return (
          ((u.username || "") + " " + (u.email || "") + " " + (u.userId || ""))
            .toLowerCase()
            .indexOf(qL) >= 0
        );
      });
  }, [users, filter, q]);

  // when server provides pagination, we still show current page slice from server results,
  // but keep pageItems fallback to filtered slice if needed.
  const pageItems =
    users.length > 0 && users.length <= perPage
      ? users
      : filtered.slice((page - 1) * perPage, page * perPage);

  async function doBan(id) {
    // optimistic UI update
    setUsers((prev) =>
      prev.map((u) =>
        String(u._id || u.id || u.userId) === String(id)
          ? { ...u, isBanned: true }
          : u
      )
    );
    toast.success("User bị khoá (tạm)");
    // TODO: call real API and refetch from server
  }
  async function doUnban(id) {
    setUsers((prev) =>
      prev.map((u) =>
        String(u._id || u.id || u.userId) === String(id)
          ? { ...u, isBanned: false, banUntil: null }
          : u
      )
    );
    toast.success("User đã mở khoá (tạm)");
  }

  function onConfirm() {
    if (!confirm) return;
    if (confirm.action === "ban") doBan(confirm.id);
    if (confirm.action === "unban") doUnban(confirm.id);
    setConfirm(null);
    setSelected(null);
  }

  return (
    <div className="p-6">
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-100 to-emerald-50 flex items-center justify-center text-sky-700">
              <UsersIcon className="w-5 h-5" />
            </div>
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tài khoản — tìm kiếm, lọc, khoá, mở khoá và xem chi tiết
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Stat icon={<UserIcon className="w-5 h-5" />} label="Total (page)" value={users.length} />
            <Stat icon={<Ban className="w-5 h-5 text-rose-600" />} label="Banned" value={stats.banned} />
            <Stat icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />} label="Verified" value={stats.verified} />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex items-center bg-white rounded-lg px-3 py-2 shadow-sm w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              className="outline-none text-sm w-full"
              placeholder="Search username / email / id"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            {q && (
              <button
                className="text-slate-400 ml-2"
                onClick={() => setQ("")}
                aria-label="Clear"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm px-2 py-1 flex items-center gap-1">
            <button
              className={`text-sm px-3 py-1 rounded ${
                filter === "all" ? "bg-slate-900 text-white" : "text-slate-700"
              }`}
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
            >
              All
            </button>
            <button
              className={`text-sm px-3 py-1 rounded ${
                filter === "verified"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-700"
              }`}
              onClick={() => {
                setFilter("verified");
                setPage(1);
              }}
            >
              !Verified
            </button>
            <button
              className={`text-sm px-3 py-1 rounded ${
                filter === "banned" ? "bg-rose-600 text-white" : "text-slate-700"
              }`}
              onClick={() => {
                setFilter("banned");
                setPage(1);
              }}
            >
              Banned
            </button>
          </div>

          <button
            onClick={() => loadUsers({ pageParam: page, qParam: q, filterParam: filter })}
            className="ml-2 bg-white px-3 py-2 rounded-lg shadow-sm text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* table card */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-fixed">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left w-2/5">User</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell w-1/3">Email</th>
                <th className="px-4 py-3 text-center hidden md:table-cell w-20">Followers</th>
                <th className="px-4 py-3 text-center w-28">Status</th>
                <th className="px-4 py-3 text-right w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100" />
                        <div className="w-40 h-4 bg-slate-100 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="w-48 h-4 bg-slate-100 rounded" />
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="w-12 h-4 bg-slate-100 rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="w-24 h-6 bg-slate-100 rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="w-20 h-8 bg-slate-100 rounded inline-block mx-auto" />
                    </td>
                  </tr>
                ))
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                pageItems.map((u) => {
                  const id = String(u._id || u.id || u.userId || "");
                  return (
                    <tr key={id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt="avatar"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              { u.userId || "—"}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {u.username || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 hidden sm:table-cell truncate">
                        {u.email || "—"}
                      </td>

                      <td className="px-4 py-4 hidden md:table-cell text-center">
                        {u.followersCount ?? 0}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!u.isVerified && (
                            <Badge color="green">
                              <Check className="w-3 h-3" /> Verified
                            </Badge>
                          )}
                          {u.isBanned && (
                            <Badge color="rose">
                              <Ban className="w-3 h-3" /> Banned
                            </Badge>
                          )}
                          {u.isVerified && !u.isBanned && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => setSelected(u)}
                            className="px-3 py-1 rounded-lg bg-white shadow-sm text-sm"
                          >
                            View
                          </button>
                          {u.isBanned ? (
                            <button
                              onClick={() =>
                                setConfirm({
                                  action: "unban",
                                  id,
                                  label: u.username || id,
                                })
                              }
                              className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setConfirm({ action: "ban", id, label: u.username || id })
                              }
                              className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 text-sm"
                            >
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
          <div className="text-sm text-slate-600">
            {total > 0
              ? `Showing ${(page - 1) * perPage + 1} - ${Math.min(page * perPage, total)} of ${total}`
              : "No users"}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border"
            >
              Prev
            </button>
            <div className="px-3 py-1 bg-white rounded shadow-sm text-sm">
              {page} / {totalPages}
            </div>
            <button
              disabled={page === totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* details modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-[720px] max-w-[92vw] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selected.avatarUrl ? (
                    <img
                      src={selected.avatarUrl}
                      className="w-16 h-16 rounded-full object-cover"
                      alt="avatar"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-slate-500" />
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-semibold">
                      {selected.username || selected.userId}
                    </div>
                    <div className="text-sm text-slate-500">{selected.email}</div>
                    <div className="mt-2 flex gap-2">
                      {selected.isVerified && (
                        <Badge color="green">
                          <ShieldCheck className="w-4 h-4" /> Verified
                        </Badge>
                      )}
                      {selected.isBanned && (
                        <Badge color="rose">
                          <Ban className="w-4 h-4" /> Banned
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <button onClick={() => setSelected(null)}>
                  <XCircle className="w-6 h-6 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Profile</div>
                  <div className="mt-2 space-y-2 text-slate-700">
                    <div>
                      <strong>Full name:</strong> {selected.fullName || "—"}
                    </div>
                    <div>
                      <strong>UserId:</strong> {selected.userId || selected._id}
                    </div>
                    <div>
                      <strong>Bio:</strong> {selected.bio || "—"}
                    </div>
                    <div>
                      <strong>Website:</strong> {selected.website || "—"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Stats</div>
                  <div className="mt-2 space-y-2 text-slate-700">
                    <div>
                      <strong>Followers:</strong> {selected.followersCount ?? 0}
                    </div>
                    <div>
                      <strong>Following:</strong> {selected.followingCount ?? 0}
                    </div>
                    <div>
                      <strong>Created:</strong>{" "}
                      {new Date(selected.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {selected.isBanned ? (
                  <button
                    onClick={() =>
                      setConfirm({
                        action: "unban",
                        id: String(selected._id || selected.id || selected.userId),
                        label: selected.username,
                      })
                    }
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded"
                  >
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setConfirm({
                        action: "ban",
                        id: String(selected._id || selected.id || selected.userId),
                        label: selected.username,
                      })
                    }
                    className="px-4 py-2 bg-rose-600 text-white rounded"
                  >
                    Ban
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 bg-white rounded border"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* confirm modal */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/40"
            onClick={() => setConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-lg p-5 w-full max-w-sm"
            >
              <h3 className="text-lg font-semibold mb-2">
                {confirm.action === "ban" ? "Confirm ban" : "Confirm unban"}
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to <span className="font-medium">{confirm.action}</span>{" "}
                <span className="font-semibold">{confirm.label}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirm(null)}
                  className="px-3 py-2 bg-white rounded border"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-3 py-2 bg-rose-600 text-white rounded"
                >
                  {confirm.action === "ban" ? "Ban" : "Unban"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* tiny placeholder icon component used above (keeps file self-contained) */
function FilePlaceholderIcon() {
  return (
    <svg
      className="w-5 h-5 text-slate-600"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M7 7h6l3 3v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}