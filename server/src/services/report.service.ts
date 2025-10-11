import mongoose from "mongoose";
import ReportModel from "@/models/report.model";
import UserModel from "@/models/user.model";
import PostModel from "@/models/post.model";
import { AppError } from "@/utils/AppError";
import ErrorFactory from "@/utils/ErrorFactory";
import NotificationModel from "@/models/notification.model";

class ReportService {
  /**
   * Tạo báo cáo mới
   */
  async createReport(data: {
    reporterId: string | mongoose.Types.ObjectId;
    targetType: "user" | "post";
    targetId: string | mongoose.Types.ObjectId;
    reason: string;
    details?: string;
  }) {
    const { reporterId, targetType, targetId, reason, details } = data;

    if (!reason?.trim()) throw ErrorFactory.requiredField("reason");
    if (typeof targetId === "string" && !mongoose.Types.ObjectId.isValid(targetId)) {
      throw AppError.badRequest("Invalid targetId");
    }

    // Xác thực đối tượng được báo cáo
    if (targetType === "user") {
      const user = await UserModel.findById(targetId);
      if (!user) throw ErrorFactory.resourceNotFound("User");
    } else if (targetType === "post") {
      const post = await PostModel.findById(targetId);
      if (!post) throw ErrorFactory.resourceNotFound("Post");
    } else {
      throw AppError.badRequest("Invalid targetType");
    }

    const report = await ReportModel.create({
      reporter: reporterId,
      targetType,
      targetId,
      reason: reason.trim(),
      details,
    });

    return report;
  }

  /**
   * Lấy danh sách báo cáo (phân trang + lọc)
   */
  async getReports({
    page = 1,
    limit = 10,
    type,
    status,
  }: {
    page?: number;
    limit?: number;
    type?: "user" | "post";
    status?: "pending" | "resolved";
  }) {
    const skip = (page - 1) * limit;

    const query: any = {};
    if (type) query.targetType = type;
    if (status) query.status = status;

    const [reports, total] = await Promise.all([
      ReportModel.find(query)
        .populate("reporter", "username userId avatarUrl userId")
        .populate("resolvedBy", "username userId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReportModel.countDocuments(query),
    ]);

    return {
      data: reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Đánh dấu báo cáo là đã xử lý
   */
 async resolveReportsByPost({
  postId,
  adminId,
  key,
}: {
  postId: string | mongoose.Types.ObjectId;
  adminId: string | mongoose.Types.ObjectId;
  key: string;
}) {
  // Tìm tất cả report liên quan đến post
  const reports = await ReportModel.find({ targetId: postId, targetType: "post" });

  if (!reports.length) throw AppError.notFound("No reports found for this post");

  // Lấy thông tin bài viết để biết ai là chủ sở hữu
  const post = await PostModel.findById(postId).populate("user", "_id username");

  if (!post) throw AppError.notFound("Post not found");

  // Đánh dấu tất cả report là resolved
  await ReportModel.updateMany(
    { targetId: postId, targetType: "post" },
    {
      $set: {
        status: "resolved",
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    }
  );

  // Nếu key != "skip" → xóa luôn bài viết và gửi thông báo đến chủ sở hữu
  let postDeleted = false;

  if (key !== "skip") {
    // Gửi thông báo tới chủ bài viết
    await NotificationModel.create({
      recipient: post.user._id,
      sender: adminId,
      type: "post_removed",
      post: post._id,
      message:
        "Bài viết của bạn đã bị xóa vì vi phạm tiêu chuẩn cộng đồng.",
    });
    // Xóa bài viết
    await PostModel.findByIdAndDelete(postId);
    postDeleted = true;
  }

  return {
    resolvedCount: reports.length,
    postDeleted,
  };
}



  /**
   * Lấy chi tiết báo cáo
   */
  async getReportDetail(reportId: string | mongoose.Types.ObjectId) {
    const report = await ReportModel.findById(reportId)
      .populate("reporter", "username userId avatarUrl")
      .populate("resolvedBy", "username userId");

    if (!report) throw ErrorFactory.resourceNotFound("Report");
    return report;
  }
}

export default new ReportService();