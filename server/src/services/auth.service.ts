import { AppErrorCode } from "@/constants/appErrorCode";
import { APP_ORIGIN } from "@/constants/env";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "@/constants/http";
import VerificationCodeType from "@/constants/verificationCodeType";
import SessionModel from "@/models/session.model";
import UserModel from "@/models/user.model";
import VerificationCodeModel from "@/models/verificationCode.model";
import appAssert from "@/utils/appAssert";
import { hashValue } from "@/utils/bcrypt";
import {
  ONE_DAY_MS,
  fiveMinutesAgo,
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "@/utils/date";
import { getPasswordResetTemplate, getVerifyEmailTemplate } from "@/utils/emailTemplates";
import { RefreshTokenPayload, refreshTokenSignOptions, signToken, verifyToken } from "@/utils/jwt";
import { sendMail } from "@/utils/sendMail";
import AppError from "@/utils/AppError";

type CreateAccountParams = {
  email: string;
  password: string;
  username: string;
  userAgent?: string | undefined;
};

export const sendEmailVerification = async (email: string) => {
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, "User not found");

  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });

  const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;

  const { error } = await sendMail({
    to: email,
    ...getVerifyEmailTemplate(url),
  });

  if (error) console.error(error);

  return verificationCode;
};
function normalizeUsername(username: string) {
  return username
    .trim()              // bỏ khoảng trắng đầu/cuối
    .toLowerCase()       // chuyển thành chữ thường
    .replace(/\s+/g, "."); // thay khoảng trắng = dấu chấm
}


function generateUserId(username: string) {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // số ngẫu nhiên 4 chữ số
  return `${normalizeUsername(username)}.${randomNum}`;
}

export const createAccount = async (data: CreateAccountParams) => {
  const existingUser = await UserModel.exists({ email: data.email });
  appAssert(!existingUser, CONFLICT, "Email already in use");

  // tạo userId từ username + số random
  let userId: string;
  let isTaken = true;

  do {
    userId = generateUserId(data.username);
    const exists = await UserModel.exists({ userId });
    isTaken = !!exists;
  } while (isTaken); // nếu trùng thì random lại

  const user = await UserModel.create({
    userId, // thêm userId
    email: data.email,
    username: data.username,
    password: data.password,
  });

  await sendEmailVerification(user.email);

  return {
    message: "Account created successfully. Please check your email to verify your account.",
    user: user.omitPassword(),
  };
};

type LoginParams = {
  email: string;
  password: string;
  userAgent?: string | undefined;
};

export const loginUser = async ({ email, password, userAgent }: LoginParams) => {
  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Invalid email or password", AppErrorCode.INVALID_CREDENTIALS);

  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password", AppErrorCode.INVALID_CREDENTIALS);

  appAssert(
    user.verified,
    UNAUTHORIZED,
    "Please verify your email before logging in",
    AppErrorCode.EMAIL_NOT_VERIFIED
  );

  // Kiểm tra khóa tạm thời
  if (user.isBanned && user.banUntil && user.banUntil > new Date()) {
    throw AppError.forbidden("Tài khoản của bạn đang bị khóa tạm thời. Vui lòng thử lại sau.");
  }
  // Nếu hết hạn ban, tự động mở khóa
  if (user.isBanned && user.banUntil && user.banUntil <= new Date()) {
    user.isBanned = false;
    user.banUntil = null;
    await user.save();
  }

  const userId = user._id;
  const session = await SessionModel.create({
    userId,
    userAgent,
  });

  const sessionInfo: RefreshTokenPayload = {
    sessionId: session._id,
  };

  const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);
  const accessToken = signToken({
    ...sessionInfo,
    userId,
  });
  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const loginWithGoogle = async ({
  email,
  username,
  avatarUrl,
  googleId,
  userAgent,
}: {
  email: string;
  username: string;
  avatarUrl?: string;
  googleId: string;
  userAgent: string;
}) => {
  let user = await UserModel.findOne({ email });
  const userId = generateUserId(username);
  if (!user) {
    // ✅ Chưa có tài khoản nào → tạo mới bằng Google
    user = await UserModel.create({
      email,
      userId,
      username, // Thêm username vào đây
      provider: "google",
      verified: true,
      avatarUrl,
      googleId, // Lưu Google ID để tracking
    });
  } else {
    // ✅ Đã có tài khoản, kiểm tra provider
    if (user.provider === "local") {
      // 👉 Cho phép login bằng Google nếu email khớp
      // 👉 Liên kết Google với tài khoản hiện có
      user.provider = "google+local";
      user.googleId = googleId; // Lưu Google ID
      await user.save();
    } else if (user.provider === "google" || user.provider === "google+local") {
      // Cập nhật thông tin nếu có thay đổi
    
      if (user.googleId !== googleId) {
        user.googleId = googleId;
      }
      // Cập nhật username nếu user chưa có hoặc muốn sync với Google
      if (!user.username || user.username === "Google User") {
        user.username = username;
      }
      // Chỉ save nếu có thay đổi
      if (user.isModified()) {
        await user.save();
      }
    }
  }

  const session = await SessionModel.create({
    userId: user._id,
    userAgent,
  });

  const sessionInfo: RefreshTokenPayload = {
    sessionId: session._id,
  };

  const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);
  const accessToken = signToken({
    ...sessionInfo,
    userId: user._id,
  });

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const verifyEmail = async (code: string) => {
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    { new: true }
  );
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email");

  await validCode.deleteOne();

  return {
    user: updatedUser.omitPassword(),
  };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

  const session = await SessionModel.findById(payload.sessionId);
  const now = Date.now();
  appAssert(session && session.expiresAt.getTime() > now, UNAUTHORIZED, "Session expired");

  // refresh the session if it expires in the next 24hrs
  const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }

  const newRefreshToken = sessionNeedsRefresh
    ? signToken(
        {
          sessionId: session._id,
        },
        refreshTokenSignOptions
      )
    : undefined;

  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return {
    accessToken,
    newRefreshToken,
  };
};

export const sendPasswordResetEmail = async (email: string) => {
  // Catch any errors that were thrown and log them (but always return a success)
  // This will prevent leaking sensitive data back to the client (e.g. user not found, email not sent).
  try {
    const user = await UserModel.findOne({ email });
    appAssert(user, NOT_FOUND, "User not found");

    // check for max password reset requests (2 emails in 5min)
    const fiveMinAgo = fiveMinutesAgo();
    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
      type: VerificationCodeType.PasswordReset,
      createdAt: { $gt: fiveMinAgo },
    });
    appAssert(count <= 1, TOO_MANY_REQUESTS, "Too many requests, please try again later");

    const expiresAt = oneHourFromNow();
    const verificationCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationCodeType.PasswordReset,
      expiresAt,
    });

    const url = `${APP_ORIGIN}/password/reset?code=${
      verificationCode._id
    }&exp=${expiresAt.getTime()}`;

    const { data, error } = await sendMail({
      to: email,
      ...getPasswordResetTemplate(url),
    });

    appAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`);
    return {
      url,
      emailId: data.id,
    };
  } catch (error: any) {
    console.log("SendPasswordResetError:", error.message);
    return {};
  }
};

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};

export const resetPassword = async ({ verificationCode, password }: ResetPasswordParams) => {
  const validCode = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

  const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
    password: await hashValue(password),
  });
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password");

  await validCode.deleteOne();

  // delete all sessions
  await SessionModel.deleteMany({ userId: validCode.userId });

  return { user: updatedUser.omitPassword() };
};

export const logoutUser = async (sessionId: string) => {
  await SessionModel.findByIdAndDelete(sessionId);
};
