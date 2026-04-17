import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TaskService } from "./task.service";

const createTask = catchAsync(async (req, res) => {
  const result = await TaskService.createTaskIntoDB(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Task created and assigned successfully!",
    data: result,
  });
});

const getTasksByProperty = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  const result = await TaskService.getTasksByPropertyFromDB(propertyId as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Tasks retrieved successfully!",
    data: result,
  });
});

const updateTaskStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status: taskStatus } = req.body;
  const result = await TaskService.updateTaskStatusIntoDB(id as string, taskStatus);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Task status updated successfully!",
    data: result,
  });
});

const deleteTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  await TaskService.deleteTaskFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Task deleted successfully!",
  });
});

export const TaskController = {
  createTask,
  getTasksByProperty,
  updateTaskStatus,
  deleteTask,
};
