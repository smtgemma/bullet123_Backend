import { Team } from "@prisma/client";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import status from "http-status";

const createTeamIntoDB = async (userId: string, payload: { name: string; memberIds?: string[] }) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found!");
  }

  if (payload.memberIds && payload.memberIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: payload.memberIds } }
    });

    if (users.length !== payload.memberIds.length) {
      throw new ApiError(status.BAD_REQUEST, "One or more User IDs are invalid!");
    }
  }

  const result = await prisma.team.create({
    data: {
      name: payload.name,
      municipalityId: municipality.id,
      members: payload.memberIds ? {
        connect: payload.memberIds.map(id => ({ id }))
      } : undefined
    },
    include: {
      members: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      }
    }
  });

  return result;
};

const getMyTeamsFromDB = async (userId: string) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found!");
  }

  const result = await prisma.team.findMany({
    where: { municipalityId: municipality.id },
    include: {
      members: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      },
      _count: {
        select: { properties: true }
      }
    }
  });

  return result;
};

const getSingleTeamFromDB = async (teamId: string) => {
  const result = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          profilePic: true,
          isVerified: true
        }
      },
      properties: true
    }
  });

  if (!result) {
    throw new ApiError(status.NOT_FOUND, "Team not found!");
  }

  return result;
};

const addMembersToTeamIntoDB = async (teamId: string, memberIds: string[]) => {
  const isExist = await prisma.team.findUnique({ where: { id: teamId } });
  if (!isExist) {
    throw new ApiError(status.NOT_FOUND, "Team not found!");
  }

  if (memberIds && memberIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } }
    });

    if (users.length !== memberIds.length) {
      throw new ApiError(status.BAD_REQUEST, "One or more User IDs are invalid!");
    }
  }

  const result = await prisma.team.update({
    where: { id: teamId },
    data: {
      members: {
        connect: memberIds.map(id => ({ id }))
      }
    },
    include: {
      members: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      }
    }
  });

  return result;
};

const removeMemberFromTeamFromDB = async (teamId: string, memberId: string) => {
  const result = await prisma.team.update({
    where: { id: teamId },
    data: {
      members: {
        disconnect: { id: memberId }
      }
    }
  });

  return result;
};

const deleteTeamFromDB = async (teamId: string) => {
  await prisma.team.delete({ where: { id: teamId } });
  return null;
};

export const TeamService = {
  createTeamIntoDB,
  getMyTeamsFromDB,
  getSingleTeamFromDB,
  addMembersToTeamIntoDB,
  removeMemberFromTeamFromDB,
  deleteTeamFromDB
};
