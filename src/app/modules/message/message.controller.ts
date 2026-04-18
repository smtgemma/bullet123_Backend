import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MessageService } from "./message.service";

const getMessagesByProperty = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  const result = await MessageService.getMessagesByPropertyFromDB(propertyId as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Messages retrieved successfully!",
    data: result,
  });
});

export const MessageController = {
  getMessagesByProperty,
};
