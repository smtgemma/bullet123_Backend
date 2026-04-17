import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import status from "http-status";

const createTaskIntoDB = async (payload: any) => {
  const { title, description, dueDate, assigneeId, propertyId, file } = payload;

  const result = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: new Date(dueDate),
      file,
      assigneeId,
      propertyId,
    },
    include: {
      assignee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true
        }
      },
      property: true
    }
  });

  return result;
};

const getTasksByPropertyFromDB = async (propertyId: string) => {
  const result = await prisma.task.findMany({
    where: { propertyId },
    include: {
      assignee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true
        }
      }
    },
    orderBy: { dueDate: "asc" }
  });

  return result;
};

const updateTaskStatusIntoDB = async (taskId: string, status: any) => {
  const result = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      assignee: true
    }
  });

  return result;
};

const deleteTaskFromDB = async (taskId: string) => {
  await prisma.task.delete({ where: { id: taskId } });
  return null;
};

export const TaskService = {
  createTaskIntoDB,
  getTasksByPropertyFromDB,
  updateTaskStatusIntoDB,
  deleteTaskFromDB
};
