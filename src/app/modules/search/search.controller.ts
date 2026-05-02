import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SearchService } from "./search.service";

const searchProperties = catchAsync(async (req, res) => {
  const result = await SearchService.searchPublicPropertiesFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Search results retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

export const SearchController = {
  searchProperties,
};
