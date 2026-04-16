import status from "http-status";

import ApiError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { IMunicipalityUpdate } from "./municipality.interface";
import prisma from "../../utils/prisma";



// ── Get all Municipalities ─────────────────────────────────────────────────
const getAllMunicipalitiesFromDB = async (query: Record<string, unknown>) => {
  const include = {
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePic: true,
        role: true,
        isVerified: true,
        isSubscribed: true,
        createdAt: true,
      },
    },
  };

  const queryBuilder = new QueryBuilder(prisma.municipality, query)
    .search(["email"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include(include);

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { meta, data: result };
};

// ── Get single Municipality by ID ──────────────────────────────────────────
const getSingleMunicipalityFromDB = async (id: string) => {
  const municipality = await prisma.municipality.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
          isVerified: true,
          isSubscribed: true,
          createdAt: true,
        },
      },
    },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality not found!");
  }

  return municipality;
};

// ── Get my Municipality profile ────────────────────────────────────────────
const getMyMunicipalityProfileFromDB = async (userId: string) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
          isVerified: true,
          isSubscribed: true,
          createdAt: true,
        },
      },
    },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found!");
  }

  return municipality;
};

// ── Update Municipality ────────────────────────────────────────────────────
const updateMunicipalityIntoDB = async (
  userId: string,
  payload: IMunicipalityUpdate
) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found!");
  }

  const updated = await prisma.municipality.update({
    where: { userId },
    data: payload,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        },
      },
    },
  });

  return updated;
};

// ── Delete Municipality ────────────────────────────────────────────────────
const deleteMunicipalityFromDB = async (id: string) => {
  const municipality = await prisma.municipality.findUnique({ where: { id } });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality not found!");
  }

  await prisma.municipality.delete({ where: { id } });

  return null;
};

export const MunicipalityService = {
  getAllMunicipalitiesFromDB,
  getSingleMunicipalityFromDB,
  getMyMunicipalityProfileFromDB,
  updateMunicipalityIntoDB,
  deleteMunicipalityFromDB,
};
