import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import http from "http";

import connectToDatabase from "@/config/db";
import { ADMIN_ORIGIN, APP_ORIGIN, NODE_ENV, PORT } from "@/constants/env";
import authenticate from "@/middleware/authenticate";
import errorHandler from "@/middleware/errorHandler";
import analyticsRoutes from "@/routes/analytics.route";
import authRoutes from "@/routes/auth.route";
import collectionRoutes from "@/routes/collection.route";
import commentRoutes from "@/routes/comment.route";
import directMessageRoutes from "@/routes/directMessage.route";
import hashtagRoutes from "@/routes/hashtag.route";
import notificationRoutes from "@/routes/notification.route";
import postRoutes from "@/routes/post.route";
import savedPostRoutes from "@/routes/savedPost.route";
import sessionRoutes from "@/routes/session.route";
import storyRoutes from "@/routes/story.route";
import userRoutes from "@/routes/user.route";
import mediaRoutes from "./routes/media.route";
import ReportRoutes from "./routes/report.route";
import searchRoutes from "./routes/search.route";
import { initializeSocket } from "./socket"; // import h�m kh?i t?o socket
import UserBlockRoutes from "./routes/userBlock.routes";
import AudioRoutes from "./routes/audio.route";
import fetch from "node-fetch";
import "@/jobs/unbanJobs"; // Thêm dòng này để cron job tự động chạy khi server khởi động
import "@/jobs/strikeDecayJob";

const app = express();
const allowedOrigins = [APP_ORIGIN, ADMIN_ORIGIN];
// add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(cookieParser());

// health check
app.get("/", (_, res) => {
  return res.status(200).json({
    status: "healthy",
  });
});

// auth routes
app.use("/auth", authRoutes);

// post routes
app.use("/posts", authenticate, postRoutes);

// protected routes
app.use("/users", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);
app.use("/comments", authenticate, commentRoutes);
app.use("/collections", authenticate, collectionRoutes);
app.use("/notifications", authenticate, notificationRoutes);
app.use("/saved", authenticate, savedPostRoutes);
app.use("/stories", authenticate, storyRoutes);
app.use("/hashtags", authenticate, hashtagRoutes);
app.use("/analytics", authenticate, analyticsRoutes);
app.use("/media", authenticate, mediaRoutes);
app.use("/messages", authenticate, directMessageRoutes);
app.use("/audio", authenticate, AudioRoutes);
app.use("/report", authenticate, ReportRoutes);

app.use("/api/search", authenticate, searchRoutes);
app.use("/block/user", authenticate, UserBlockRoutes);

// error handler
app.use(errorHandler);

const server = http.createServer(app);
initializeSocket(server); // Kh?i t?o socket v?i server

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT} in ${NODE_ENV} environment`);
  await connectToDatabase();
});
