import status from "http-status";
import config from "../../config";
import { UserService } from "./user.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";


const getAllUser = catchAsync(async (req, res) => {
  const result = await UserService.getAllUserFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Users are retrieved successfully!",
   
    data: result.data,
    meta:result.meta
  });
});
const getAllAdminFromDB = catchAsync(async (req, res) => {
  const result = await UserService.getAllAdminFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Users are retrieved successfully!",
    data: result.data,
    meta:result.meta
  });
});

const updateUser = catchAsync(async (req, res) => {
  const userId = req?.user?.id as string

  // if (req.file) {
  //   req.body.profilePic = `${config.url.image}/uploads/${req.file.filename}`;
  // }

  const result = await UserService.updateUserIntoDB(userId, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User updated successfully!",
    data: result,
  });
});
const updateUserProfile = catchAsync(async (req, res) => {
  const userId = req?.user?.id as string;
  const file = req.file as Express.MulterS3.File

  const upload = { ...req.body, profilePic: file?.location };
  console.log(upload)
  const result = await UserService.updateUserProfileIntoDB(userId, upload);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User profile updated successfully!",
    data: result,
  });
});

const getSingleUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const result = await UserService.getSingleUserByIdFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User retrieved successfully!",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  await UserService.deleteUserFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User deleted successfully!",
  });
});


const deleteMe = catchAsync(async (req, res) => {
  const userId  = req.user?.id as string
  const {password}=req.body

  await UserService.deleteMeFromDB(userId,password);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User deleted successfully!",
  });
});
const chengeUserRoleIntoDB= catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;    

  const result = await UserService.chengeUserRoleIntoDB(id, role);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User role changed successfully!",
    data: result,
  });
}
);

const inviteUserToAdmin= catchAsync(async (req, res) => {   
  const payload=req.body  
  console.log(payload)
  const result = await UserService.inviteUserToAdminToDB(payload);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Invitation sent and user role updated to ADMIN successfully!",

  });
} );

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsersFromDB(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Users retrieved successfully",
    data: result.data,
  });
});

export const UserController = {
  getAllUser,
  updateUser,
  deleteUser,
  getSingleUserById,
  updateUserProfile,
  chengeUserRoleIntoDB,inviteUserToAdmin,
  getAllAdminFromDB,
  deleteMe
,getAllUsers
};
