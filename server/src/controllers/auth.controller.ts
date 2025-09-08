import { BAD_REQUEST, OK, UNAUTHORIZED } from "@/constants/http";
import {
  createAccount,
  loginUser,
  loginWithGoogle,
  logoutUser,
  refreshUserAccessToken,
  resetPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyEmail,
} from "@/services/auth.service";
import appAssert from "@/utils/appAssert";

import catchErrors from "@/utils/catchErrors";
import {
  clearAuthCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
} from "@/utils/cookies";
import { verifyToken } from "@/utils/jwt";
import { ResponseUtil } from "@/utils/response";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "./auth.schemas";

export const sendEmailVerificationHandler = catchErrors(async (req, res) => {
  const email = emailSchema.parse(req.body.email);

  await sendEmailVerification(email);

  return ResponseUtil.success(res, undefined, "Verification email sent");
});

export const registerHandler = catchErrors(async (req, res) => {
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"] || undefined,
  });

  const result = await createAccount(request);

  return ResponseUtil.created(res, result);
});

export const googleLoginHandler = catchErrors(async (req, res) => {
  const { email, name, picture, googleId } = req.body;

  // Validate required fields
  appAssert(email, BAD_REQUEST, "Missing email");
  appAssert(googleId, BAD_REQUEST, "Missing Google ID");

  const userAgentRaw = req.headers["user-agent"];
  const userAgent = Array.isArray(userAgentRaw)
    ? userAgentRaw.join(" ")
    : userAgentRaw || "unknown";

  const { user, accessToken, refreshToken } = await loginWithGoogle({
    email,
    username: name || "Google User",
    avatarUrl: picture,
    googleId, // Thêm googleId để identify user
    userAgent,
  });

  return setAuthCookies({ res, accessToken, refreshToken }).status(200).json({
    user,
    message: "Google login successful",
  });
});

export const loginHandler = catchErrors(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"] || undefined,
  });
  const { accessToken, refreshToken } = await loginUser(request);

  // set cookies and send response
  setAuthCookies({ res, accessToken, refreshToken });
  return ResponseUtil.success(res, accessToken, "Login successful");
});

export const logoutHandler = catchErrors(async (req, res) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  const { payload } = verifyToken(accessToken || "");

  if (payload) {
    // remove session from db
    await logoutUser(payload.sessionId as string);
  }

  // clear cookies
  return clearAuthCookies(res).status(OK).json({ message: "Logout successful" });
});

export const refreshHandler = catchErrors(async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

  const { accessToken, newRefreshToken } = await refreshUserAccessToken(refreshToken);
  if (newRefreshToken) {
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
  }

  return res
    .status(OK)
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .json({ message: "Access token refreshed" });
});

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  await verifyEmail(verificationCode);

  return res.status(OK).json({ message: "Email was successfully verified" });
});

export const sendPasswordResetHandler = catchErrors(async (req, res) => {
  const email = emailSchema.parse(req.body.email);

  await sendPasswordResetEmail(email);

  return res.status(OK).json({ message: "Password reset email sent" });
});

export const resetPasswordHandler = catchErrors(async (req, res) => {
  const request = resetPasswordSchema.parse(req.body);

  await resetPassword(request);

  return clearAuthCookies(res).status(OK).json({ message: "Password was reset successfully" });
});
