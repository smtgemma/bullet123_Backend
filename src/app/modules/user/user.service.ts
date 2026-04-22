import status from "http-status";
import config from "../../config";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import { User, UserRole } from "@prisma/client";
import { sendContactEmail, sendEmail } from "../../utils/sendEmail";
import QueryBuilder from "../../builder/QueryBuilder";
import { jwtHelpers } from "./../../helpers/jwtHelpers";
import { hashPassword } from "../../helpers/hashPassword";
import { get } from "http";
import { passwordCompare } from "../../helpers/comparePasswords";

const getAllUserFromDB = async (query: Record<string, unknown>) => {
  const include = {
    Profile: true,
    artwork: true,
    Municipality: true,
    Subscription: {
      include: {
        plan: true,
      },
    },
  };

  const queryBuilder = new QueryBuilder(prisma.user, query)
    .search(["email", "fullName"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include(include);

  queryBuilder.rawFilter({
    role: UserRole.USER,
    isDeleted: false,
    artwork: {
      some: {}
    }
  });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  if (!result.length) {
    throw new ApiError(status.NOT_FOUND, "No users found!");
  }

  const data = result.map((user: any) => {
    const {
      password,
      canResetPassword,
      isResentOtp,
      isResetPassword,
      resetPasswordOTP,
      resetPasswordOTPExpiresAt,
      passwordChangedAt,
      ...rest
    } = user;

    return rest;
  });


  data.sort((a: any, b: any) => (b.artwork?.length || 0) - (a.artwork?.length || 0));

  return {
    meta,
    data,
  };
};



const getAllAdminFromDB = async (query: Record<string, unknown>) => {
  const include = {
    Profile: true,
    Municipality: true,
    Subscription: {
      where: {
        status: "ACTIVE",
      },
      include: {
        plan: true,

      },
    },

  };

  const queryBuilder = new QueryBuilder(prisma.user, query)
    .search(["email", "fullName"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include(include);

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  if (!result.length) {
    throw new ApiError(status.NOT_FOUND, "No users found!");
  }

  const data = result.map((user: any) => {
    const {
      password,
      canResetPassword,
      isResentOtp,
      isResetPassword,
      resetPasswordOTP,
      resetPasswordOTPExpiresAt,
      passwordChangedAt,
      ...rest
    } = user;

    return rest;
  });

  return {
    meta,
    data,
  };
};
const updateUserIntoDB = async (userId: string, payload: Partial<User>) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!payload.profilePic && isUserExist.profilePic) {
    payload.profilePic = isUserExist.profilePic;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: payload.fullName,
      profilePic: payload.profilePic
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profilePic: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const updateUserProfileIntoDB = async (userId: string, payload: Partial<any>) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const userUpdateData: any = {};
  if (payload?.fullName) userUpdateData.fullName = payload.fullName;
  if (payload?.profilePic) userUpdateData.profilePic = payload.profilePic;

  const profileData: any = {};
  if (payload?.birthDate) profileData.birthDate = new Date(payload.birthDate);
  if (payload?.bio) profileData.bio = payload.bio;
  if (payload?.location) profileData.location = payload.location;
  if (payload?.phone) profileData.phone = payload.phone;
  if (payload?.website) profileData.website = payload.website;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...userUpdateData,
      Profile: {
        upsert: {
          create: profileData,
          update: profileData,
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profilePic: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      Profile: {
        select: {
          id: true,
          bio: true,
          location: true,  
          phone: true,      
          website: true,
          birthDate: true,
        },
      },
    },
  });

  return updatedUser;
};

const getSingleUserByIdFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Profile: true,
      Municipality: true,
      Subscription: {
        include: {
          plan: true
        }
      }
    }
  })

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const { password, ...rest } = user;

  return rest;
};

const deleteUserFromDB = async (userId: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      isVerified: false
    },
  });

  return null;
};
const deleteMeFromDB = async (userId: string, password: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const isPasswordMatched = await passwordCompare(
    password,
    isUserExist.password
  );

  if (!isPasswordMatched) {
    throw new ApiError(status.UNAUTHORIZED, "Password is incorrect!");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      isVerified: false
    },
  });

  return null;
};
const chengeUserRoleIntoDB = async (userId: string, role: UserRole) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      fullName: true,
      email: true,
      profilePic: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

}
const inviteUserToAdminToDB = async (payload: { email: string, fullName: string, description: string }) => {
  const isUserExistByEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (!isUserExistByEmail) {
    throw new ApiError(

      status.BAD_REQUEST,
      `this user das not exists: ${payload.email} in database!`
    );
  }
  const sendEmail = await sendContactEmail(payload?.email, payload);

  const chengeRole = await prisma.user.update({
    where: { email: payload.email },
    data: { role: UserRole.ADMIN }
  })
  return chengeRole
}

const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const include = {
    Profile: true,
    Subscription: {
      include: {
        plan: true,
      },
    },
  };

  const queryBuilder = new QueryBuilder(prisma.user, query)
    .search(["email", "fullName"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include(include);

  queryBuilder.rawFilter({
    isDeleted: false,
  });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  if (!result.length) {
    throw new ApiError(status.NOT_FOUND, "No users found!");
  }

  const data = result.map((user: any) => {
    const {
      password,
      canResetPassword,
      isResentOtp,
      isResetPassword,
      resetPasswordOTP,
      resetPasswordOTPExpiresAt,
      passwordChangedAt,
      ...rest
    } = user;

    return rest;
  });

  return {
    meta,
    data,
  };
};

const getProfessionalsFromDB = async (query: Record<string, unknown>) => {
  const include = {
    Profile: true,
    receivedReviews: {
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            profilePic: true,
          }
        }
      },
      orderBy: { createdAt: "desc" as const }
    },
    _count: {
      select: {
        assignedProperties: true,
        receivedReviews: true,
      }
    }
  };

  const queryBuilder = new QueryBuilder(prisma.user, query)
    .search(["fullName", "email"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include(include);

  // Filter only professionals (by Roles) and not deleted
  // If the frontend passed a specific role e.g. ?role=CONTRACTOR, QueryBuilder handles it via filter()
  // Otherwise default to including all professional roles:
  const allowedRoles = ["CONTRACTOR", "INSPECTOR", "REALTOR", "LENDER", "ADMIN", "MUNICIPALITY", "STAFF", "SUPER_ADMIN", "COMMUNITY_PARTNER", "BUYER", "SELLER"];
  
  const rawFilterInput: any = { isDeleted: false };
  if (!query.role) {
     rawFilterInput.role = { in: ["CONTRACTOR", "INSPECTOR", "REALTOR", "LENDER"] };
  }

  queryBuilder.rawFilter(rawFilterInput);

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  const data = result.map((user: any) => {
    const { password, ...rest } = user;
    
    // Calculate average rating
    const reviews = user.receivedReviews || [];
    const totalRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    return {
      ...rest,
      projectsCompleted: user._count?.assignedProperties || 0,
      totalReviews: user._count?.receivedReviews || 0,
      averageRating: parseFloat(avgRating as string)
    };
  });

  return { meta, data };
};


export const UserService = {
  getAllUserFromDB,
  updateUserIntoDB,
  deleteUserFromDB,
  getSingleUserByIdFromDB,
  updateUserProfileIntoDB,
  chengeUserRoleIntoDB,
  inviteUserToAdminToDB,
  getAllAdminFromDB,
  deleteMeFromDB,
  getAllUsersFromDB,
  getProfessionalsFromDB
};
