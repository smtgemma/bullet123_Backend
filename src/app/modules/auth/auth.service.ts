import status from "http-status";
import config from "../../config";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import { RefreshPayload } from "./auth.interface";
import { sendEmail } from "../../utils/sendEmail";
import { jwtHelpers } from "./../../helpers/jwtHelpers";
import { passwordCompare } from "../../helpers/comparePasswords";
import { hashPassword } from "../../helpers/hashPassword";
import AppError from "../../errors/AppError";
import redisClient from "../../config/redis";
import { UserRole } from "@prisma/client";

// ── OTP Email Template ─────────────────────────────────────────────────────
const buildOtpEmail = (email: string, otp: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:300;">Email Verification</h1>
            <p style="color:#ffffff;margin:10px 0 0 0;font-size:16px;opacity:0.9;">Secure your account with OTP verification</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 30px;">
            <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Hello there,</p>
            <p style="color:#666666;font-size:16px;line-height:1.6;margin:0 0 30px 0;">We received a request to verify your email address. Please use the following verification code:</p>
            <div style="background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%);border:2px solid #667eea;border-radius:12px;padding:30px;text-align:center;margin:30px 0;">
              <p style="color:#666666;font-size:14px;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
              <h1 style="color:#667eea;font-size:36px;font-weight:bold;letter-spacing:8px;margin:0;font-family:'Courier New',monospace;">${otp}</h1>
            </div>
            <div style="background-color:#fff3cd;border:1px solid #ffeaa7;border-radius:8px;padding:20px;margin:30px 0;">
              <p style="color:#856404;font-size:14px;margin:0;line-height:1.5;">
                <strong>⚠️ Important:</strong> This code will expire in <strong>10 minutes</strong>.
              </p>
            </div>
            <p style="color:#666666;font-size:16px;line-height:1.6;margin:20px 0;">If you didn't request this, please ignore this email.</p>
            <div style="background-color:#f8f9fa;border-left:4px solid #667eea;padding:20px;margin:30px 0;">
              <h3 style="color:#333333;font-size:16px;margin:0 0 10px 0;">🔒 Security Tips:</h3>
              <ul style="color:#666666;font-size:14px;margin:0;padding-left:20px;">
                <li style="margin:5px 0;">Never share your verification code with anyone</li>
                <li style="margin:5px 0;">We will never ask for your code via phone or email</li>
              </ul>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8f9fa;padding:30px;text-align:center;border-top:1px solid #e9ecef;">
            <p style="color:#6c757d;font-size:14px;margin:0;">Best regards,<br><strong style="color:#667eea;">Your App Team</strong></p>
            <p style="color:#adb5bd;font-size:12px;margin:10px 0 0;">This email was sent to ${email}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Reset OTP Email Template ───────────────────────────────────────────────
const buildResetOtpEmail = (
  fullName: string,
  email: string,
  otp: string,
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:300;">Password Reset Request</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 30px;">
            <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Hello <strong>${fullName}</strong>,</p>
            <p style="color:#666666;font-size:16px;line-height:1.6;margin:0 0 30px 0;">Use the following OTP to reset your password:</p>
            <div style="background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%);border:2px solid #667eea;border-radius:12px;padding:30px;text-align:center;margin:30px 0;">
              <p style="color:#666666;font-size:14px;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:1px;">One-Time Password</p>
              <h1 style="color:#667eea;font-size:36px;font-weight:bold;letter-spacing:8px;margin:0;font-family:'Courier New',monospace;">${otp}</h1>
            </div>
            <div style="background-color:#fff3cd;border:1px solid #ffeaa7;border-radius:8px;padding:20px;margin:30px 0;">
              <p style="color:#856404;font-size:14px;margin:0;line-height:1.5;">
                <strong>⚠️ Important:</strong> This OTP will expire in <strong>10 minutes</strong>.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8f9fa;padding:30px;text-align:center;border-top:1px solid #e9ecef;">
            <p style="color:#6c757d;font-size:14px;margin:0;">Best regards,<br><strong style="color:#667eea;">Your App Team</strong></p>
            <p style="color:#adb5bd;font-size:12px;margin:10px 0 0;">This email was sent to ${email}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Register ───────────────────────────────────────────────────────────────
interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  profilePic?: string;
  role: UserRole;
}

const register = async (payload: RegisterPayload) => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  const isUserExistByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (isUserExistByEmail?.isDeleted) {
    throw new AppError(
      status.FORBIDDEN,
      "Your account has been deleted. Please contact support.",
    );
  }

  // User exists but not verified → resend OTP
  if (isUserExistByEmail && !isUserExistByEmail.isVerified) {
    const existingOtp = await redisClient.get(`otp:${normalizedEmail}`);
    if (existingOtp) {
      throw new ApiError(
        status.CONFLICT,
        "Please check your inbox and verify your email.",
      );
    }
    // OTP expired → send new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.setEx(`otp:${normalizedEmail}`, 600, otp);
    const emailContent = buildOtpEmail(normalizedEmail, otp);
    await sendEmail(
      normalizedEmail,
      "🔐 Email Verification Code - Action Required",
      emailContent,
    );

    // provide better message for unverified users
    throw new ApiError(
      status.CONFLICT,
      "A user with this email already exists but is not verified. A new OTP has been sent to your email. Please verify your account.",
    );
  }

  if (isUserExistByEmail) {
    throw new ApiError(status.CONFLICT, "User already exists!");
  }

  const hashedPassword = await hashPassword(payload.password);

  // Create user with isVerified: false
  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        fullName: payload.fullName,
        email: normalizedEmail,
        password: hashedPassword,
        profilePic: payload.profilePic,
        isVerified: false,
        role: payload.role,
      },
    });

    await tx.subscriber.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: { email: normalizedEmail },
    });
  });

  // Generate OTP and store in Redis (10 min)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.setEx(`otp:${normalizedEmail}`, 600, otp);

  const emailContent = buildOtpEmail(normalizedEmail, otp);
  await sendEmail(
    normalizedEmail,
    "🔐 Email Verification Code - Action Required",
    emailContent,
  );

  return {
    message:
      "Registration successful! Please check your email to verify your account.",
  };
};

// ── Verify OTP ─────────────────────────────────────────────────────────────
const verifyOTP = async (email: string, otpCode: string) => {
  if (!email || !otpCode) {
    throw new ApiError(status.BAD_REQUEST, "Email and OTP are required!");
  }

  if (otpCode.length !== 6) {
    throw new ApiError(status.BAD_REQUEST, "OTP must be 6 digits!");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (user.isVerified) {
    throw new ApiError(status.BAD_REQUEST, "User is already verified.");
  }

  // Get OTP from Redis
  const cachedOtp = await redisClient.get(`otp:${normalizedEmail}`);

  if (!cachedOtp) {
    throw new ApiError(
      status.NOT_FOUND,
      "OTP not found or expired. Please request a new OTP.",
    );
  }

  if (cachedOtp !== otpCode.trim()) {
    throw new ApiError(
      status.UNAUTHORIZED,
      "Invalid OTP. Please check the code and try again.",
    );
  }

  // Delete OTP from Redis
  await redisClient.del(`otp:${normalizedEmail}`);

  // Activate user
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { email: normalizedEmail },
      data: { isVerified: true },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        message: `Welcome ${user.fullName}! Your account is now verified.`,
      },
    });

    // Auto-create Municipality profile if role is MUNICIPALITY
    if (user.role === UserRole.MUNICIPALITY) {
      await tx.municipality.create({
        data: {
          userId: user.id,
          email: user.email,
        },
      });
    }
  });

  const jwtPayload = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePic: user?.profilePic || "",
    isVerified: true,
    isSubscribed: user.isSubscribed,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string,
  );

  const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string,
  );

  // Send success email (non-blocking)
  const successEmailContent = `
    <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;background:#f4f4f4;padding:24px;border-radius:8px;">
      <div style="background:linear-gradient(135deg,#28a745 0%,#20c997 100%);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;">✅ Email Verified Successfully!</h1>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;">
        <p style="color:#333;">Congratulations <strong>${user.fullName}</strong>! Your email has been verified.</p>
        <p style="color:#333;">Verified on: <strong>${new Date().toLocaleString()}</strong></p>
      </div>
    </div>`;

  sendEmail(
    normalizedEmail,
    "Email Verified Successfully!",
    successEmailContent,
  ).catch((err) => console.error("Failed to send success email:", err));

  return {
    message: "Email verified successfully.",
    accessToken,
    refreshToken,
  };
};

// ── Resend Email Verification OTP ──────────────────────────────────────────
const resendEmailVerificationOtp = async (email: string) => {
  if (!email) throw new ApiError(status.BAD_REQUEST, "Email is required");

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) throw new ApiError(status.NOT_FOUND, "User not found");
  if (user.isVerified)
    throw new ApiError(status.BAD_REQUEST, "User is already verified.");

  // Delete old OTP and create new one
  await redisClient.del(`otp:${normalizedEmail}`);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.setEx(`otp:${normalizedEmail}`, 600, otp);

  const emailContent = buildOtpEmail(normalizedEmail, otp);
  await sendEmail(
    normalizedEmail,
    "🔐 Email Verification Code - Action Required",
    emailContent,
  );

  return { message: "OTP resent successfully. Please check your email." };
};

// ── Login ──────────────────────────────────────────────────────────────────
const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new ApiError(status.NOT_FOUND, "User not found!");

  if (user.isDeleted) {
    throw new AppError(
      status.FORBIDDEN,
      "Your account has been deleted. Please contact support.",
    );
  }

  if (!user.isVerified) {
    const existingOtp = await redisClient.get(`otp:${email}`);
    if (existingOtp) {
      throw new ApiError(
        status.UNAUTHORIZED,
        "Please verify your email first. Check your inbox.",
      );
    }
    // OTP expired → send new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.setEx(`otp:${email}`, 600, otp);
    const emailContent = buildOtpEmail(email, otp);
    await sendEmail(
      email,
      "🔐 Email Verification Code - Action Required",
      emailContent,
    );
    throw new ApiError(
      status.UNAUTHORIZED,
      "Your OTP has expired. A new OTP has been sent to your email.",
    );
  }

  const isPasswordMatched = await passwordCompare(password, user.password);
  if (!isPasswordMatched) {
    throw new ApiError(
      status.UNAUTHORIZED,
      "Invalid email and password. Please try again!",
    );
  }

  const jwtPayload = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
    role: user.role,
    isVerified: user.isVerified,
    isSubscribed: user.isSubscribed,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string,
  );

  const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string,
  );

  return { accessToken, refreshToken };
};

// ── Change Password ────────────────────────────────────────────────────────
const changePassword = async (
  email: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new ApiError(status.NOT_FOUND, "User not found!");
  if (!newPassword)
    throw new ApiError(status.BAD_REQUEST, "New password is required!");
  if (!confirmPassword)
    throw new ApiError(status.BAD_REQUEST, "Confirm password is required!");

  if (newPassword !== confirmPassword) {
    throw new ApiError(
      status.BAD_REQUEST,
      "New password and confirm password do not match!",
    );
  }

  const isPasswordMatch = await passwordCompare(currentPassword, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(status.UNAUTHORIZED, "Current password is incorrect!");
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: { password: hashedNewPassword, passwordChangedAt: new Date() },
  });

  return null;
};

// ── Forgot Password ────────────────────────────────────────────────────────
const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new ApiError(status.NOT_FOUND, "User not found!");
  if (!user.isVerified)
    throw new ApiError(status.UNAUTHORIZED, "User account is not verified!");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store reset OTP in Redis (10 min)
  await redisClient.setEx(`reset-otp:${email}`, 600, otp);

  const emailContent = buildResetOtpEmail(user.fullName, user.email, otp);
  await sendEmail(user.email, "Password Reset OTP", emailContent);

  return {
    message:
      "We have sent a 6-digit OTP to your email address. Please check your inbox.",
  };
};

// ── Verify Reset Password OTP ──────────────────────────────────────────────
const verifyResetPasswordOTP = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new ApiError(status.NOT_FOUND, "User not found!");

  const cachedOtp = await redisClient.get(`reset-otp:${email}`);

  if (!cachedOtp) {
    throw new ApiError(
      status.BAD_REQUEST,
      "OTP not found or expired. Please request a new OTP.",
    );
  }

  if (cachedOtp !== otp) {
    throw new ApiError(status.BAD_REQUEST, "Invalid OTP!");
  }

  await redisClient.del(`reset-otp:${email}`);
  await redisClient.setEx(`can-reset:${email}`, 600, "true");

  return {
    message: "OTP verified successfully. You can now reset your password.",
  };
};

// ── Resend Reset Password OTP ──────────────────────────────────────────────
const resendResetPasswordOtp = async (email: string) => {
  if (!email) throw new ApiError(status.BAD_REQUEST, "Email is required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(status.NOT_FOUND, "User not found");

  await redisClient.del(`reset-otp:${email}`);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.setEx(`reset-otp:${email}`, 600, otp);

  const emailContent = buildResetOtpEmail(user.fullName, user.email, otp);
  await sendEmail(email, "🔐 Password Reset OTP", emailContent);

  return { message: "OTP resent successfully. Please check your email." };
};

// ── Reset Password ─────────────────────────────────────────────────────────
const resetPassword = async (
  email: string,
  newPassword: string,
  confirmPassword: string,
) => {
  if (newPassword !== confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "Passwords do not match!");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(status.NOT_FOUND, "User not found!");

  const canReset = await redisClient.get(`can-reset:${email}`);
  if (!canReset) {
    throw new ApiError(
      status.BAD_REQUEST,
      "User is not eligible for password reset!",
    );
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword, passwordChangedAt: new Date() },
  });

  await redisClient.del(`can-reset:${email}`);

  return { message: "Password reset successfully!" };
};

// ── Get Me ─────────────────────────────────────────────────────────────────
const getMe = async (email: string) => {
  const result = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      profilePic: true,
      role: true,
      isVerified: true,
      isSubscribed: true,
      planExpiration: true,
      Profile: true,
      Subscription: true,
    },
  });

  return result;
};

// ── Refresh Token ──────────────────────────────────────────────────────────
export const refreshToken = async (token: string) => {
  const decoded = jwtHelpers.verifyToken(
    token,
    config.jwt.refresh.secret as string,
  ) as RefreshPayload;

  const { email, iat } = decoded;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profilePic: true,
      isVerified: true,
      passwordChangedAt: true,
    },
  });

  if (!user) throw new ApiError(status.NOT_FOUND, "User not found");

  if (
    user.passwordChangedAt &&
    Math.floor(user.passwordChangedAt.getTime() / 1000) > iat
  ) {
    throw new ApiError(
      status.UNAUTHORIZED,
      "Password was changed after this token was issued",
    );
  }

  const jwtPayload = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePic: user?.profilePic,
    isVerified: user.isVerified,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string,
  );

  return { accessToken };
};

// ── Create Staff Account (Invited by Admin/Municipality) ──────────────────
const createStaffAccount = async (payload: { fullName: string; email: string; role: UserRole }) => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  const isUserExist = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (isUserExist) {
    throw new ApiError(status.CONFLICT, "User with this email already exists!");
  }

  // Create user with a dummy password and isVerified: false
  // Random password logic not needed as user will set it via setupPassword
  const tempPassword = await hashPassword(Math.random().toString(36).slice(-10));

  const result = await prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: normalizedEmail,
      password: tempPassword,
      role: payload.role,
      isVerified: false,
    },
  });

  // Generate Setup Token (expires in 24h)
  const setupToken = jwtHelpers.createToken(
    { email: normalizedEmail },
    config.jwt.access.secret as string,
    "24h"
  );

  // Store token in Redis to verify during setup
  await redisClient.setEx(`setup-token:${normalizedEmail}`, 24 * 3600, setupToken);

  // Send Invitation Email
  const setupUrl = `${config.url.frontend}/setup-password?token=${setupToken}&email=${normalizedEmail}`;
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
      <h2 style="color: #4CAF50; text-align: center;">Welcome to Bullet Backend!</h2>
      <p>Hello <strong>${payload.fullName}</strong>,</p>
      <p>You have been invited to join our platform as a <strong>${payload.role}</strong>.</p>
      <p>To get started and activate your account, please set your password by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${setupUrl}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Set Up Your Password</a>
      </div>
      <p>This link will expire in 24 hours.</p>
      <p>If you have any questions, feel free to contact our support team.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">Bullet Backend Team</p>
    </div>
  `;

  await sendEmail(normalizedEmail, "🔐 Invitation to Join - Set Up Your Password", emailContent);

  return { message: "Invitation sent successfully!" };
};

// ── Setup Password (Activate Account) ─────────────────────────────────────
const setupPassword = async (payload: { token: string; email: string; password: string }) => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  // Verify token from Redis
  const cachedToken = await redisClient.get(`setup-token:${normalizedEmail}`);
  if (!cachedToken || cachedToken !== payload.token) {
    throw new ApiError(status.BAD_REQUEST, "Invalid or expired setup token!");
  }

  const hashedPassword = await hashPassword(payload.password);

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: {
      password: hashedPassword,
      isVerified: true,
      passwordChangedAt: new Date(),
    },
  });

  // Delete token from Redis after use
  await redisClient.del(`setup-token:${normalizedEmail}`);

  return { message: "Password set successfully! Your account is now active." };
};

export const AuthService = {
  getMe,
  loginUser,
  refreshToken,
  resetPassword,
  changePassword,
  forgotPassword,
  verifyResetPasswordOTP,
  register,
  verifyOTP,
  resendEmailVerificationOtp,
  resendResetPasswordOtp,
  createStaffAccount,
  setupPassword,
};
