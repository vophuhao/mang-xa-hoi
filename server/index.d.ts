import type mongoose from "mongoose";

declare global {
  namespace Express {
    interface Request {
      userId: mongoose.Types.ObjectId;
      sessionId: mongoose.Types.ObjectId;
      // Additional request properties for better typing
      startTime?: number;
      requestId?: string;
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT: string;
      MONGO_URI: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      RESEND_API_KEY?: string;
      CLIENT_URL: string;
    }
  }
}

// Extend Error class for custom app errors
declare global {
  interface Error {
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
  }
}

export {};
