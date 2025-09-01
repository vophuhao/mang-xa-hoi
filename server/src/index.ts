import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";

import connectToDatabase from "@/config/db";
import { APP_ORIGIN, NODE_ENV, PORT } from "@/constants/env";
import authenticate from "@/middleware/authenticate";
import errorHandler from "@/middleware/errorHandler";
import analyticsRoutes from "@/routes/analytics.route";
import authRoutes from "@/routes/auth.route";
import commentRoutes from "@/routes/comment.route";
import hashtagRoutes from "@/routes/hashtag.route";
import notificationRoutes from "@/routes/notification.route";
import postRoutes from "@/routes/post.route";
import savedPostRoutes from "@/routes/savedPost.route";
import sessionRoutes from "@/routes/session.route";
import storyRoutes from "@/routes/story.route";
import userRoutes from "@/routes/user.route";

const app = express();

// add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: APP_ORIGIN,
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
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);
app.use("/comments", authenticate, commentRoutes);
app.use("/notifications", authenticate, notificationRoutes);
app.use("/saved", authenticate, savedPostRoutes);
app.use("/stories", authenticate, storyRoutes);
app.use("/hashtags", authenticate, hashtagRoutes);
app.use("/analytics", authenticate, analyticsRoutes);

// error handler
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT} in ${NODE_ENV} environment`);
  await connectToDatabase();
});
