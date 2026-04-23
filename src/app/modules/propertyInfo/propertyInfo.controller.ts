import status from "http-status";
import PDFDocument from "pdfkit";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PropertyInfoService } from "./propertyInfo.service";

const createPropertyInfo = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;

  // Handle multiple images from req.files if using multer, 
  // but for now assuming direct payload or single file handling in future.
  // design shows multiple images selection.

  const result = await PropertyInfoService.createPropertyInfoIntoDB(userId, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,

    message: "Property created successfully!",
    data: result,
  });
});

const getAllPropertyInfos = catchAsync(async (req, res) => {
  const result = await PropertyInfoService.getAllPropertyInfosFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,

    message: "Property infos retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSinglePropertyInfo = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PropertyInfoService.getSinglePropertyInfoFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,

    message: "Property info retrieved successfully!",
    data: result,
  });
});

const updatePropertyInfo = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PropertyInfoService.updatePropertyInfoIntoDB(id as string, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Property info updated successfully!",
    data: result,
  });
});

const deletePropertyInfo = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PropertyInfoService.deletePropertyInfoFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,

    message: "Property info deleted successfully!",
    data: null,
  });
});

const getMyProperties = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await PropertyInfoService.getMyPropertiesFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "My properties retrieved successfully!",
    data: result,
  });
});

const assignStaff = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { staffIds } = req.body;
  const result = await PropertyInfoService.assignStaffToPropertyInDB(id as string, staffIds);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Staff assigned successfully!",
    data: result,
  });
});

const removeStaff = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { staffId } = req.body;
  const result = await PropertyInfoService.removeStaffFromPropertyInDB(id as string, staffId as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Staff removed successfully!",
    data: result,
  });
});

const getPropertyStats = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await PropertyInfoService.getPropertyStatsFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Property stats retrieved successfully!",
    data: result,
  });
});

const getUniqueTimezones = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await PropertyInfoService.getUniqueTimezonesFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Unique timezones retrieved successfully!",
    data: result,
  });
});

const getUniqueLocationsByTimezone = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const { timezone } = req.query;
  const result = await PropertyInfoService.getUniqueLocationsByTimezoneFromDB(userId, timezone as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Unique locations for timezone retrieved successfully!",
    data: result,
  });
});

const getPropertyDashboardData = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await PropertyInfoService.getPropertyDashboardDataFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Dashboard data retrieved successfully!",
    data: result,
  });
});

const getEconomicImpact = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await PropertyInfoService.getEconomicImpactFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Economic impact data retrieved successfully!",
    data: result,
  });
});

const downloadEconomicImpactPDF = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const data: any = await PropertyInfoService.getEconomicImpactFromDB(userId);

  const doc = new PDFDocument({ margin: 50 });
  const filename = `Economic_Impact_Summary_${Date.now()}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

  doc.pipe(res);

  // PDF Content styling based on the mockup
  doc.fontSize(24).text("Economic Impact Summary", { align: "center" });
  doc.moveDown();

  doc.fontSize(16).text("Summary Metrics", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Revenue Gained (Actual): $${data.summary.revenueGained.toLocaleString()}`);
  doc.text(`Annual Tax Revenue: $${data.summary.annualTaxRevenue.toLocaleString()}`);
  doc.fillColor("red").text(`Estimated Revenue Loss: ($${data.summary.estimatedRevenueLoss.toLocaleString()})`);
  doc.fillColor("black").moveDown();

  doc.fontSize(16).text("Property Impact Details", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Tax Revenue Generated: $${data.details.taxRevenueGenerated.toLocaleString()}`);
  doc.text(`Projected Revenue: $${data.details.projectedRevenue.toLocaleString()}`);
  doc.text(`Annual Loss (Vacant): $${data.details.annualLossVacant.toLocaleString()}`);
  doc.moveDown();

  doc.text(`Total Completed Properties: ${data.details.totalCompletedProperties}`);
  doc.text(`Total Properties in Pipeline: ${data.details.totalPropertiesInPipeline}`);
  doc.text(`Total Vacant Properties: ${data.details.totalVacantProperties}`);

  doc.end();
});

const downloadPropertyReportPDF = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data: any = await PropertyInfoService.getPropertyReportDataFromDB(id as string);

  const doc = new PDFDocument({ margin: 50 });
  const filename = `Property_Report_${id}_${Date.now()}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

  doc.pipe(res);

  // Title
  doc.fontSize(22).text("Property Completion Report", { align: "center" });
  doc.fontSize(14).text("Official Evidence Document", { align: "center" });
  doc.moveDown(2);

  // 1. Property Information
  doc.fontSize(16).text("1. Property Information", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Property Address: ${data.property.address}`);
  doc.text(`Municipality: ${data.property.municipality}`);
  doc.moveDown();

  // 2. Progress & Completion
  doc.fontSize(16).text("2. Progress & Completion", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Completion: ${data.financials.completionPercentage}%`);
  doc.text(`Days Active: ${data.property.daysActive} days`);
  doc.text(`Status: ${data.property.status}`);
  doc.moveDown();

  // 3. Financial Summary
  doc.fontSize(16).text("3. Financial Summary", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Total Budget: $${data.financials.totalBudget.toLocaleString()}`);
  doc.text(`Paid Amount: $${data.financials.totalPaid.toLocaleString()}`);
  doc.text(`Remaining: $${data.financials.remaining.toLocaleString()}`);
  doc.moveDown();

  // 4. Contractors & Team
  doc.fontSize(16).text("4. Contractors & Team", { underline: true });
  doc.moveDown(0.5);
  data.team.forEach((member: any) => {
    doc.fontSize(12).text(`[ ] ${member.fullName} - ${member.role}`);
  });
  doc.moveDown();

  // 5. Dates & Metadata
  doc.fontSize(16).text("5. Dates & Metadata", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Start Date: ${new Date(data.property.startDate).toLocaleDateString()}`);
  if (data.property.completionDate) {
    doc.text(`Completion Date: ${new Date(data.property.completionDate).toLocaleDateString()}`);
  }
  
  doc.end();
});

const getPropertyReportData = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PropertyInfoService.getPropertyReportDataFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Property report data retrieved successfully!",
    data: result,
  });
});

export const PropertyInfoController = {
  createPropertyInfo,
  getAllPropertyInfos,
  getSinglePropertyInfo,
  updatePropertyInfo,
  deletePropertyInfo,
  getMyProperties,
  assignStaff,
  removeStaff,
  getPropertyStats,
  getUniqueTimezones,
  getUniqueLocationsByTimezone,
  getPropertyDashboardData,
  getEconomicImpact,
  downloadEconomicImpactPDF,
  downloadPropertyReportPDF,
  getPropertyReportData,
};
