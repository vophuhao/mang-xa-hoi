import type { RequestHandler } from "express";
import type mongoose from "mongoose";

import { UNAUTHORIZED } from "@/constants/http";
import { appAssert, AppErrorCode } from "@/utils/errors";
import { verifyToken } from "@/utils/jwt";

// Extend the Request interface for this file
declare module "express-serve-static-core" {
  interface Request {
    userId: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
  }
}

// wrap with catchErrors() if you need this to be async
const authenticate: RequestHandler = (req, _res, next) => {
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

    req.userId = payload.userId as mongoose.Types.ObjectId;
    req.sessionId = payload.sessionId as mongoose.Types.ObjectId;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
