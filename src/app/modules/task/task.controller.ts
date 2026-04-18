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

const getSingleTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TaskService.getSingleTaskFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Task retrieved successfully!",
    data: result,
  });
});

const addAssignees = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { assigneeIds } = req.body;
  const result = await TaskService.addAssigneesToTaskInDB(id as string, assigneeIds);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Assignees added successfully!",
    data: result,
  });
});

const removeAssignee = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { assigneeId } = req.body;
  const result = await TaskService.removeAssigneeFromTaskInDB(id as string, assigneeId as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Assignee removed successfully!",
    data: result,
  });
});

const updateTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TaskService.updateTaskIntoDB(id as string, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Task updated successfully!",
    data: result,
  });
});

export const TaskController = {
  createTask,
  getTasksByProperty,
  updateTaskStatus,
  deleteTask,
  getSingleTask,
  addAssignees,
  removeAssignee,
  updateTask,
};
