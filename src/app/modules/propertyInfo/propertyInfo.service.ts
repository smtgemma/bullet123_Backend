import status from "http-status";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { IPropertyInfo } from "./propertyInfo.interface";

const createPropertyInfoIntoDB = async (userId: string, payload: IPropertyInfo) => {
  // Find municipality by userId
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found for this user!");
  }

  const { assignedStaffIds, teamIds, teamName, ...propertyData } = payload;

  const result = await prisma.propertyInfo.create({
    data: {
      ...propertyData,
      municipalityId: municipality.id,
      // Handle automatic team creation if teamName and staffIds are provided
      teams: {
        connect: teamIds ? teamIds.map(id => ({ id })) : [],
        create: (teamName && assignedStaffIds) ? [
          {
            name: teamName,
            municipalityId: municipality.id,
            members: {
              connect: assignedStaffIds.map(id => ({ id }))
            }
          }
        ] : []
      },
      // Keep individual assignment for direct access tracking
      assignedStaff: assignedStaffIds ? {
        connect: assignedStaffIds.map(id => ({ id }))
      } : undefined
    },
    include: {
      assignedStaff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
          isVerified: true
        }
      },
      teams: {
        include: {
          members: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePic: true,
              role: true,
              isVerified: true
            }
          }
        }
      }
    }
  });

  return result;
};

const getAllPropertyInfosFromDB = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(prisma.propertyInfo, query)
    .search(["propertyAddress", "zone", "propertyType", "vacancyStatus"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include({
      municipality: true,
      assignedStaff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        }
      },
      teams: true
    });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { meta, data: result };
};

const getSinglePropertyInfoFromDB = async (id: string) => {
  const result = await prisma.propertyInfo.findUnique({
    where: { id },
    include: {
      municipality: true,
      assignedStaff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        }
      },
      teams: {
        include: {
          members: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePic: true,
              role: true,
            }
          }
        }
      }
    },
  });

  if (!result) {
    throw new ApiError(status.NOT_FOUND, "Property info not found!");
  }

  return result;
};

const updatePropertyInfoIntoDB = async (id: string, payload: Partial<IPropertyInfo>) => {
  const isExist = await prisma.propertyInfo.findUnique({ where: { id } });

  if (!isExist) {
    throw new ApiError(status.NOT_FOUND, "Property info not found!");
  }

  const { assignedStaffIds, teamIds, ...updateData } = payload;

  const result = await prisma.propertyInfo.update({
    where: { id },
    data: {
      ...updateData,
      assignedStaff: assignedStaffIds ? {
        set: assignedStaffIds.map(id => ({ id }))
      } : undefined,
      teams: teamIds ? {
        set: teamIds.map(id => ({ id }))
      } : undefined
    },
    include: {
      assignedStaff: true,
      teams: true
    }
  });

  return result;
};

const deletePropertyInfoFromDB = async (id: string) => {
  const isExist = await prisma.propertyInfo.findUnique({ where: { id } });

  if (!isExist) {
    throw new ApiError(status.NOT_FOUND, "Property info not found!");
  }

  await prisma.propertyInfo.delete({ where: { id } });

  return null;
};

const getMyPropertiesFromDB = async (userId: string) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality not found!");
  }

  const result = await prisma.propertyInfo.findMany({
    where: { municipalityId: municipality.id },
  });

  return result;
};

export const PropertyInfoService = {
  createPropertyInfoIntoDB,
  getAllPropertyInfosFromDB,
  getSinglePropertyInfoFromDB,
  updatePropertyInfoIntoDB,
  deletePropertyInfoFromDB,
  getMyPropertiesFromDB,
};
