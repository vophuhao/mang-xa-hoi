import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import ReportService from "@/services/report.service";
import { AppError } from "@/utils/AppError";

// Tạo báo cáo mới
export const createReportHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) throw AppError.unauthorized("Unauthorized");

  const { targetType, targetId, reason, details } = req.body;

  const report = await ReportService.createReport({
    reporterId: userId, // string | ObjectId đều hợp lệ
    targetType,
    targetId,
    reason,
    details,
  });

  return ResponseUtil.success(res, report, "Report submitted successfully");
});

// Lấy danh sách báo cáo
export const getReportsHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, type, status } = req.query;

  const params = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  } as {
    page: number;
    limit: number;
    type?: "user" | "post";
    status?: "pending" | "resolved";
  };

  if (type === "user" || type === "post") params.type = type;
  if (status === "pending" || status === "resolved") params.status = status;

  const result = await ReportService.getReports(params);

  return ResponseUtil.success(res, result, "Danh sách báo cáo");
});


// Lấy chi tiết báo cáo
export const getReportDetailHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { reportId } = req.params as { reportId?: string };
  if (!reportId) throw AppError.badRequest("reportId is required");

  const report = await ReportService.getReportDetail(reportId);
  return ResponseUtil.success(res, report);
});

// Đánh dấu báo cáo đã xử lý
export const resolveReportsByPostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params as { postId?: string };
  const { key } = req.body;
  const adminId = req.userId;

  if (!postId) throw AppError.badRequest("postId is required");
  if (!adminId) throw AppError.unauthorized("Unauthorized");

  const result = await ReportService.resolveReportsByPost({ postId, adminId, key });

  return ResponseUtil.success(res, result, "Reports resolved successfully");
});

// Đánh dấu báo cáo của người dùng đã xử lý
export const resolveReportsByUserHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { key } = req.body;
  const adminId = req.userId;
  if (!userId) throw AppError.badRequest("userId is required");
  if (!adminId) throw AppError.unauthorized("Unauthorized");

  const result = await ReportService.resolveReportsByUser({ userId, adminId, key });
  return ResponseUtil.success(res, result, "Reports resolved successfully");
});

