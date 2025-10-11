import React, { useEffect, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  User,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";

import { getReports, resolveReport } from "@/lib/api";


const Badge = ({ children, color = "gray" }) => {
  const colorMap = {
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    yellow:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    violet:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[color]}`}
    >
      {children}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (status === "resolved")
    return (
      <Badge color="green">
        <CheckCircle className="w-3.5 h-3.5" /> Đã xử lý
      </Badge>
    );
  return (
    <Badge color="yellow">
      <Flag className="w-3.5 h-3.5" /> Chưa xử lý
    </Badge>
  );
};

const TypeBadge = ({ type }) => {
  if (type === "post")
    return (
      <Badge color="blue">
        <FileText className="w-3.5 h-3.5" /> Bài viết
      </Badge>
    );
  return (
    <Badge color="violet">
      <User className="w-3.5 h-3.5" /> Người dùng
    </Badge>
  );
};

const Segmented = ({ options, value, onChange }) => {
  return (
    <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition ${active
              ? "bg-white text-blue-600 shadow dark:bg-gray-700"
              : "text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700/70"
              }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

const EmptyState = ({ title, subtitle }) => (
  <div className="text-center py-16">
    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
      <Flag className="w-6 h-6 text-gray-400" />
    </div>
    <p className="font-medium text-gray-800 dark:text-gray-100">{title}</p>
    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
  </div>
);


export default function Report() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState("post"); // post | user
  const [activeStatus, setActiveStatus] = useState("pending"); // pending | resolved
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  // Fetch reports (logic giữ nguyên)
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await getReports({
        type: activeType,
        status: activeStatus,
        page,
        limit: LIMIT,
      });

      // Hỗ trợ cả 2 dạng payload: { data: [...], pagination } hoặc { data: { data: [...], pagination } }
      const body = res?.data;
      const payload = body?.data ?? body;
      const items = Array.isArray(payload) ? payload : payload?.data || [];
      const pagination = Array.isArray(payload)
        ? body?.pagination
        : payload?.pagination || body?.pagination;

      setReports(items);
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotal(pagination.total ?? items.length);
      } else {
        setTotalPages(1);
        setTotal(items.length);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách báo cáo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, activeStatus, page]);

  const handleClick = async (postId, key) => {
    try {
      const res = await resolveReport(postId, key);
      console.log("Kết quả xử lý:", res.data);
      toast.success("Xử lý báo cáo thành công");
      onclose();
      fetchReports();
    } catch (err) {
      console.error("Lỗi:", err);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Flag className="text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Quản lý báo cáo</h2>
            <p className="text-sm text-gray-500">
              Xem, theo dõi và xử lý các báo cáo từ người dùng
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="text-sm text-gray-500">
          Kết quả:{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {loading ? "…" : reports.length}
          </span>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <Segmented
          value={activeType}
          onChange={(v) => {
            setActiveType(v);
            setPage(1); // reset page khi đổi filter
          }}
          options={[
            {
              value: "post",
              label: "Báo cáo bài viết",
              icon: <FileText className="w-4 h-4" />,
            },
            {
              value: "user",
              label: "Báo cáo người dùng",
              icon: <User className="w-4 h-4" />,
            },
          ]}
        />
        <Segmented
          value={activeStatus}
          onChange={(v) => {
            setActiveStatus(v);
            setPage(1); // reset page khi đổi filter
          }}
          options={[
            {
              value: "pending",
              label: "Chưa xử lý",
              icon: <Flag className="w-4 h-4" />,
            },
            {
              value: "resolved",
              label: "Đã xử lý",
              icon: <CheckCircle className="w-4 h-4" />,
            },
          ]}
        />
      </div>

      {/* Bảng danh sách */}
      <div className="overflow-hidden border rounded-2xl shadow-sm bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left bg-gray-50 dark:bg-gray-800/70">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Người báo cáo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Loại
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Lý do
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="Không có báo cáo nào"
                      subtitle="Thử đổi bộ lọc để xem các báo cáo khác."
                    />
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {r.reporter?.avatarUrl ? (
                          <img
                            src={r.reporter.avatarUrl}
                            alt={"User"}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {r.reporter?.userId || "Ẩn danh"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {r.reporter?.username
                              ? `${r.reporter.username}`
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <TypeBadge type={r.targetType} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[32ch] truncate" title={r.reason}>
                        {r.reason}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setSelected(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                        >
                          <Eye className="w-4 h-4" /> Xem
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {total > 0
              ? `Hiển thị ${Math.min((page - 1) * LIMIT + 1, total)}–${Math.min(
                (page - 1) * LIMIT + reports.length,
                total
              )} trong ${total}`
              : "Không có dữ liệu"}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              Trước
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-200">
              Trang {page} / {totalPages}
            </span>
            <button
              className="px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal xem chi tiết */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-[540px] max-w-[92vw]"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <Flag className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Chi tiết báo cáo</h3>
                </div>
                <button onClick={() => setSelected(null)}>
                  <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <TypeBadge type={selected.targetType} />
                <StatusBadge status={selected.status} />
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3">
                    <p className="text-gray-500">Người báo cáo</p>
                    <div className="mt-1 flex items-center gap-3">
                      {selected.reporter?.avatarUrl ? (
                        <img
                          src={selected.reporter.avatarUrl}
                          alt={selected.reporter?.userId || "User"}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {selected.reporter?.userId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selected.reporter?.username
                            ? `${selected.reporter.username}`
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <p className="text-gray-500">Lý do</p>
                    <p className="mt-1 font-medium">{selected.reason}</p>
                  </div>

                  <div className="col-span-3">
                    <p className="text-gray-500">Chi tiết</p>
                    <p className="mt-1">
                      {selected.details?.trim() || "(Không có)"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Ngày tạo</p>
                    <p className="mt-1">
                      {new Date(selected.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">ID mục tiêu</p>
                    <p className="mt-1 truncate" title={selected.targetId}>
                      {String(selected.targetId)}
                    </p>
                  </div>
                </div>
              </div>

              {selected.status === "pending" && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
                    onClick={() => handleClick(selected.targetId, "skip")}
                  >
                    Bỏ qua
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => handleClick(selected.targetId, "block")}
                  >
                    Khoá
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}