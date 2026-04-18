import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DocumentService } from "./document.service";

const uploadDocument = catchAsync(async (req, res) => {
  const result = await DocumentService.uploadDocumentIntoDB(req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Document uploaded successfully!",
    data: result,
  });
});

const getDocumentsByProperty = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  const result = await DocumentService.getDocumentsByPropertyFromDB(propertyId as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Documents retrieved successfully!",
    data: result,
  });
});

const updateDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DocumentService.updateDocumentInDB(id as string, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Document updated successfully!",
    data: result,
  });
});

const deleteDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  await DocumentService.deleteDocumentFromDB(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Document deleted successfully!",
    data: null,
  });
});

const signDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { signatoryId } = req.body;
  const result = await DocumentService.signDocumentInDB(id as string, signatoryId as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Document signed successfully!",
    data: result,
  });
});

const getSingleDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DocumentService.getSingleDocumentFromDB(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Document retrieved successfully!",
    data: result,
  });
});

const getMyDocuments = catchAsync(async (req, res) => {
  const user = (req as any).user;
  const result = await DocumentService.getMyDocumentsFromDB(user.id);
  sendResponse(res, {
    statusCode: status.OK,
    message: "My assigned documents retrieved successfully!",
    data: result,
  });
});

export const DocumentController = {
  uploadDocument,
  getSingleDocument,
  getDocumentsByProperty,
  getMyDocuments,
  updateDocument,
  deleteDocument,
  signDocument,
};
