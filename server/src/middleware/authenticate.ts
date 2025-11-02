import type { RequestHandler } from "express";
import type mongoose from "mongoose";

import { UNAUTHORIZED } from "@/constants/http";
import { appAssert, AppErrorCode } from "@/utils/errors";
import { verifyToken } from "@/utils/jwt";
import UserModel from "@/models/user.model"; // Import UserModel
import AppError from "@/utils/AppError";

// Extend the Request interface for this file
declare module "express-serve-static-core" {
  interface Request {
    userId: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
  }
}

// wrap with catchErrors() if you need this to be async
const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const accessToken = req.cookies.accessToken as string | undefined;
    appAssert(
      accessToken,
      UNAUTHORIZED,
      "Access token is required",
      AppErrorCode.INVALID_ACCESS_TOKEN
    );

    const { error, payload } = verifyToken(accessToken);
    appAssert(
      payload,
      UNAUTHORIZED,
      error === "jwt expired" ? "Token expired" : "Invalid token",
      AppErrorCode.INVALID_ACCESS_TOKEN
    );

    // Lấy user từ DB
    const user = await UserModel.findById(payload.userId);
    if (!user) throw AppError.unauthorized("User not found");

    // Kiểm tra khóa tạm thời
    if (user.isBanned && user.banUntil && user.banUntil > new Date()) {
      return _res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đang bị khóa tạm thời. Vui lòng thử lại sau.",
      });
    }
    // Nếu hết hạn ban, tự động mở khóa
    if (user.isBanned && user.banUntil && user.banUntil <= new Date()) {
      user.isBanned = false;
      user.banUntil = null;
      await user.save();
    }

    req.userId = payload.userId as mongoose.Types.ObjectId;
    req.sessionId = payload.sessionId as mongoose.Types.ObjectId;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
