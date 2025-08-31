import type { RequestHandler } from "express";
import type mongoose from "mongoose";

import { AppError } from "@/utils/AppError";
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

    if (!accessToken) {
      throw AppError.unauthorized("Access token is required");
    }

    const { error, payload } = verifyToken(accessToken);

    if (!payload) {
      const message = error === "jwt expired" ? "Token expired" : "Invalid token";
      throw AppError.unauthorized(message);
    }

    req.userId = payload.userId as mongoose.Types.ObjectId;
    req.sessionId = payload.sessionId as mongoose.Types.ObjectId;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
