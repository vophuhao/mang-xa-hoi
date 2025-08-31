import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";

import connectToDatabase from "@/config/db";
import { APP_ORIGIN, NODE_ENV, PORT } from "@/constants/env";
import authenticate from "@/middleware/authenticate";
import errorHandler from "@/middleware/errorHandler";
import authRoutes from "@/routes/auth.route";
import postRoutes from "@/routes/post.route";
import sessionRoutes from "@/routes/session.route";
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

app.use("", authenticate, postRoutes);

// protected routes
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);

// error handler
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT} in ${NODE_ENV} environment`);
  await connectToDatabase();
});
