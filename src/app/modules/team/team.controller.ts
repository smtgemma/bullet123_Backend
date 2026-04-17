import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TeamService } from "./team.service";

const createTeam = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await TeamService.createTeamIntoDB(userId, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Team created successfully!",
    data: result,
  });
});

const getMyTeams = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await TeamService.getMyTeamsFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Teams retrieved successfully!",
    data: result,
  });
});

const getSingleTeam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TeamService.getSingleTeamFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Team retrieved successfully!",
    data: result,
  });
});

const addMembersToTeam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { memberIds } = req.body;
  const result = await TeamService.addMembersToTeamIntoDB(id as string, memberIds);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Members added to team successfully!",
    data: result,
  });
});

const removeMemberFromTeam = catchAsync(async (req, res) => {
  const { id, memberId } = req.params;
  const result = await TeamService.removeMemberFromTeamFromDB(id as string, memberId as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Member removed from team successfully!",
    data: result,
  });
});

const deleteTeam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TeamService.deleteTeamFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Team deleted successfully!",
    data: result,
  });
});

export const TeamController = {
  createTeam,
  getMyTeams,
  getSingleTeam,
  addMembersToTeam,
  removeMemberFromTeam,
  deleteTeam,
};
