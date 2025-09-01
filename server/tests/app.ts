import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import authenticate from "@/middleware/authenticate";
import errorHandler from "@/middleware/errorHandler";
import analyticsRoutes from "@/routes/analytics.route";
import commentRoutes from "@/routes/comment.route";
import hashtagRoutes from "@/routes/hashtag.route";
import notificationRoutes from "@/routes/notification.route";
import postRoutes from "@/routes/post.route";
import savedPostRoutes from "@/routes/savedPost.route";
import storyRoutes from "@/routes/story.route";
import userRoutes from "@/routes/user.route";

const createApp = () => {
  const app = express();

  // add middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: "http://localhost:3000",
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

  // protected routes
  app.use("/posts", authenticate, postRoutes);
  app.use("/user", authenticate, userRoutes);
  app.use("/comments", authenticate, commentRoutes);
  app.use("/notifications", authenticate, notificationRoutes);
  app.use("/saved", authenticate, savedPostRoutes);
  app.use("/stories", authenticate, storyRoutes);
  app.use("/hashtags", authenticate, hashtagRoutes);
  app.use("/analytics", authenticate, analyticsRoutes);

  // error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
