import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import status from "http-status";

const createTaskIntoDB = async (payload: any) => {
  const { title, description, dueDate, assigneeIds, propertyId, file } = payload;

  const result = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: new Date(dueDate),
      file,
      propertyId,
      assignees: {
        connect: assigneeIds.map((id: string) => ({ id })),
      },
    },
    include: {
      assignees: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
        },
      },
      property: true,
    },
  });

  return result;
};

const getTasksByPropertyFromDB = async (propertyId: string) => {
  const result = await prisma.task.findMany({
    where: { propertyId },
    include: {
      assignees: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return result;
};

const updateTaskStatusIntoDB = async (taskId: string, status: any) => {
  const result = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      assignees: {
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

  return result;
};

const updateTaskIntoDB = async (taskId: string, payload: any) => {
  const { dueDate, ...updateData } = payload;
  
  const result = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...updateData,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
    include: {
      assignees: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
        },
      },
    },
  });

  return result;
};

const deleteTaskFromDB = async (taskId: string) => {
  await prisma.task.delete({ where: { id: taskId } });
  return null;
};

const getSingleTaskFromDB = async (taskId: string) => {
  const result = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        },
      },
      property: true,
    },
  });

  if (!result) {
    throw new ApiError(status.NOT_FOUND, "Task not found!");
  }

  return result;
};

const addAssigneesToTaskInDB = async (taskId: string, assigneeIds: string[]) => {
  const result = await prisma.task.update({
    where: { id: taskId },
    data: {
      assignees: {
        connect: assigneeIds.map((id) => ({ id })),
      },
    },
    include: {
      assignees: {
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

  return result;
};

const removeAssigneeFromTaskInDB = async (taskId: string, assigneeId: string) => {
  const result = await prisma.task.update({
    where: { id: taskId },
    data: {
      assignees: {
        disconnect: { id: assigneeId },
      },
    },
    include: {
      assignees: {
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

  return result;
};

export const TaskService = {
  createTaskIntoDB,
  getTasksByPropertyFromDB,
  updateTaskStatusIntoDB,
  deleteTaskFromDB,
  getSingleTaskFromDB,
  addAssigneesToTaskInDB,
  removeAssigneeFromTaskInDB,
  updateTaskIntoDB,
};
