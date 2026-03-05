import status from "http-status";
import config from "../../config";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import { RefreshPayload } from "./auth.interface";
import { sendEmail } from "../../utils/sendEmail";
import { jwtHelpers } from "./../../helpers/jwtHelpers";
import { passwordCompare } from "../../helpers/comparePasswords";
import { hashPassword } from "../../helpers/hashPassword";
import bcrypt from "bcrypt";
import { PaymentStatus, PlanType, SubscriptionStatus, User, UserRole } from "@prisma/client";

import AppError from "../../errors/AppError";

const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const isPasswordMatched = await passwordCompare(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(status.UNAUTHORIZED, "Password is incorrect!");
  }

  if(user.isDeleted){
    throw new AppError(status.FORBIDDEN,"Your account has been deleted.please contact support for more deatils.")
  }


  const jwtPayload = {
    id: user.id,
    fullName: user.fullName,
    email:user.email,
    profilePic: user.profilePic,
    role: user.role,
    isVerified: user.isVerified,
    isSubscribed:user.isSubscribed,
   
   
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string
  );

  const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

interface GoogleUserData {
  userId: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}


const changePassword = async (
  email: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!newPassword) {
    throw new ApiError(status.BAD_REQUEST, "New password is required!");
  }

  if (!confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "Confirm password is required!");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(
      status.BAD_REQUEST,
      "New password and confirm password do not match!"
    );
  }

  const isPasswordMatch = await passwordCompare(currentPassword, user.password);

  if (!isPasswordMatch) {
    throw new ApiError(status.UNAUTHORIZED, "Current password is incorrect!");
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
    },
  });

  return null;
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!user.isVerified) {
    throw new ApiError(status.UNAUTHORIZED, "User account is not verified!");
  }

 
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

  await prisma.user.update({
    where: { email },
    data: {
      isResetPassword: true,
      canResetPassword: false,
      resetPasswordOTP: otp,
      resetPasswordOTPExpiresAt: otpExpiresAt,
    },
  });

 
  const emailContent = `
  <h2>Password Reset Request</h2>
  <p>Hello ${user.fullName}</p>
  <p>We received a request to reset your password. Please use the following OTP to proceed:</p>

  <div style="
    background-color: #f5f5f5;
    padding: 20px;
    text-align: center;
    margin: 20px auto;
    max-width: 400px;
    width: 100%;
    border-radius: 8px;
  ">
    <h1 style="
      color: #333;
      font-size: 32px;
      letter-spacing: 5px;
      margin: 0;
    ">
      ${otp}
    </h1>
  </div>

  <p>This OTP will expire in 10 minutes.</p>
  <p>If you didn't request this password reset, please ignore this email.</p>
  <p>Best regards,<br>Your App Team</p>
`;
  await sendEmail(user.email, "Password Reset OTP", emailContent);

  return {
    message:
      "We have sent a 6-digit OTP to your email address. Please check your inbox and use the OTP to reset your password.",
  };
};

const otpGenerate = async (email: string) => {
    const isUserExistByEmail = await prisma.user.findUnique({
    where: { email: email },
  });

    if(isUserExistByEmail?.isDeleted){
    throw new AppError(status.FORBIDDEN,"Your account has been deleted.please contact support for more deatils.")
  }


  if (isUserExistByEmail) {
    throw new ApiError(
      status.BAD_REQUEST,
      `User with this email: ${email} already exists!`
    );
  }

  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  await prisma.otpModel.deleteMany({
    where: {
      email: email.toLowerCase().trim(),
      isVerified: false
    }
  });

  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

 
  await prisma.otpModel.create({
    data: {
      email: email.toLowerCase().trim(),
      code: otp,
      expiresAt: otpExpiresAt,
      isVerified: false,
    },
  });

  await prisma.subscriber.upsert({
  where: { email },
  update: {},
  create: { email },
});

  // Professional email template
  const emailContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">
                    Email Verification
                  </h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                    Secure your account with OTP verification
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello there,
                  </p>
                  
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    We received a request to verify your email address. Please use the following verification code to proceed:
                  </p>

                  <!-- OTP Box -->
                  <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border: 2px solid #667eea; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                      Verification Code
                    </p>
                    <h1 style="color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                      ${otp}
                    </h1>
                  </div>

                  <!-- Important Info -->
                  <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                      <strong>⚠️ Important:</strong> This verification code will expire in <strong>10 minutes</strong>. 
                      Please complete your verification before it expires.
                    </p>
                  </div>

                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    If you didn't request this verification code, please ignore this email and ensure your account is secure.
                  </p>

                  <!-- Security Tips -->
                  <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #333333; font-size: 16px; margin: 0 0 10px 0;">
                      🔒 Security Tips:
                    </h3>
                    <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px;">
                      <li style="margin: 5px 0;">Never share your verification code with anyone</li>
                      <li style="margin: 5px 0;">We will never ask for your code via phone or email</li>
                      <li style="margin: 5px 0;">Always verify the sender's email address</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                    Need help? Contact our support team
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    Best regards,<br>
                    <strong style="color: #667eea;">Your App Team</strong>
                  </p>
                  
                  <div style="margin-top: 20px;">
                    <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                      This email was sent to ${email.toLowerCase().trim()}
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

 const  result= await sendEmail(email, "🔐 Email Verification Code - Action Required", emailContent);

  
   return result
};


const verifyOTP = async (otpCode: string, payload: User) => {

  if (!payload || !payload.email || !otpCode) {
    throw new ApiError(status.BAD_REQUEST, "Email and OTP are required!");
  }

  if (otpCode.length !== 6) {
    throw new ApiError(status.BAD_REQUEST, "OTP must be 6 digits!");
  }

  const normalizedEmail = payload.email.toLowerCase().trim();

  const isUserExistByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

    if(isUserExistByEmail?.isDeleted){
    throw new AppError(status.FORBIDDEN,"Your account has been deleted.please contact support for more deatils.")
  }

  if (isUserExistByEmail) {
    throw new ApiError(
      status.BAD_REQUEST,
      `User with this email: ${normalizedEmail} already exists!`
    );
  }


  const otpRecord = await prisma.otpModel.findFirst({
    where: {
      email: normalizedEmail,
      isVerified: false
    },
    orderBy: { generatedAt: "desc" }
  });

  if (!otpRecord) {
    throw new ApiError(
      status.NOT_FOUND,
      "OTP not found or already used. Please request a new OTP."
    );
  }

  if (new Date() > otpRecord.expiresAt) {
    await prisma.otpModel.delete({
      where: { id: otpRecord.id }
    });
    throw new ApiError(
      status.UNAUTHORIZED,
      "OTP has expired. Please request a new verification code."
    );
  }

  if (otpRecord.code !== otpCode.trim()) {
    throw new ApiError(
      status.UNAUTHORIZED,
      "Invalid OTP. Please check the code and try again."
    );
  }

  const hashedPassword = await hashPassword(payload.password);

  const user = await prisma.$transaction(async (tx) => {

  await tx.otpModel.update({
    where: { id: otpRecord.id },
    data: { isVerified: true }
  });

 

  const createdUser = await tx.user.create({
    data: {
      ...payload,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: true,
      role: payload.role 
    }
  });

  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);

  await tx.notification.create({
    data: {
      userId: createdUser.id,
      message: `Welcome ${createdUser.fullName}! Your free subscription is now active.`,
    }
  });

  return createdUser;
});

  const jwtPayload = {
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePic: user?.profilePic || "",
    isVerified: user.isVerified,
    isSubscribed: user.isSubscribed,
    id: user.id,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string
  );

  const refreshToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

  const successEmailContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verified Successfully</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center;">
                  <div style="background-color: rgba(255,255,255,0.2); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 40px;">✅</span>
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">
                    Email Verified Successfully!
                  </h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                    Your free subscription is now active
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #28a745; font-size: 24px; margin: 0 0 10px 0;">
                      🎉 Congratulations!
                    </h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0;">
                      Your email has been verified and your <strong>FREE subscription</strong> is active!
                    </p>
                  </div>

                  <!-- Verification Details -->
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                    <p style="color: #495057; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                      Verified Email Address
                    </p>
                    <p style="color: #28a745; font-size: 18px; font-weight: bold; margin: 0; word-break: break-all;">
                      ${normalizedEmail}
                    </p>
                    <p style="color: #6c757d; font-size: 12px; margin: 15px 0 0 0;">
                      Verified on ${new Date().toLocaleString()}
                    </p>
                  </div>

                  <!-- Subscription Info -->
                  <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <p style="color: #155724; font-size: 16px; margin: 0; line-height: 1.5; text-align: center;">
                      <strong>🎁 Free Plan Active!</strong><br>
                      Your free subscription is valid for 1 year. Enjoy all features!
                    </p>
                  </div>

                  <!-- Next Steps -->
                  <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #333333; font-size: 16px; margin: 0 0 15px 0;">
                      🚀 What's Next?
                    </h3>
                    <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px;">
                      <li style="margin: 8px 0;">Complete your profile setup</li>
                      <li style="margin: 8px 0;">Explore all available features</li>
                      <li style="margin: 8px 0;">Start using your free plan</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                    Need assistance? Our support team is here to help
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    Welcome to the team!<br>
                    <strong style="color: #28a745;">Your App Team</strong>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  sendEmail(
    normalizedEmail,
    "Email Verified - Free Subscription Activated!",
    successEmailContent
  ).catch(error =>
    console.error("Failed to send success email:", error)
  );

  return { accessToken };
};

const verifyResetPasswordOTP = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!user.isResetPassword) {
    throw new ApiError(status.BAD_REQUEST, "No password reset request found!");
  }

  if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
    throw new ApiError(status.BAD_REQUEST, "Invalid OTP!");
  }

  if (
    !user.resetPasswordOTPExpiresAt ||
    new Date() > user.resetPasswordOTPExpiresAt
  ) {
    throw new ApiError(status.BAD_REQUEST, "OTP has expired!");
  }

  await prisma.user.update({
    where: { email },
    data: {
      canResetPassword: true,
      resetPasswordOTP: null,
      resetPasswordOTPExpiresAt: null,
    },
  });

  return {
    message: "OTP verified successfully. You can now reset your password.",
  };
};

const resetPassword = async (
  email: string,
  newPassword: string,
  confirmPassword: string
) => {
  if (newPassword !== confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "Passwords do not match!");
  }

  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!user.canResetPassword) {
    throw new ApiError(
      status.BAD_REQUEST,
      "User is not eligible for password reset!"
    );
  }


  

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email: email },
    data: {
      password: hashedPassword,
      isResetPassword: false,
      canResetPassword: false,
    },
  });

  return {
    message: "Password reset successfully!",
  };
};


const getMe = async (email: string) => {
  const result = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
     fullName:true,
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


export const refreshToken = async (token: string) => {
  const decoded = jwtHelpers.verifyToken(
    token,
    config.jwt.refresh.secret as string
  ) as RefreshPayload;

  const { email, iat } = decoded;
  console.log(email);

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

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  if (
    user.passwordChangedAt &&

    Math.floor(user.passwordChangedAt.getTime() / 1000) > iat
  ) {
    throw new ApiError(
      status.UNAUTHORIZED,
      "Password was changed after this token was issued"
    );
  }

  const jwtPayload = {
    id: user.id,
   fullName : user.fullName,
    email: user.email,
    role: user.role,
    profilePic: user?.profilePic,
    isVerified: user.isVerified,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

  return { accessToken };
};


export const AuthService = {
  getMe,
  loginUser,

  refreshToken,
  resetPassword,
  changePassword,
  forgotPassword,
  verifyResetPasswordOTP,
otpGenerate,
verifyOTP,


};
