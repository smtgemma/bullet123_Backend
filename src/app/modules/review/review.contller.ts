import status from "http-status";
import AppError from "../../errors/AppError";
import catchAsync from "../../utils/catchAsync";
import { ReviewServices } from "./review.services";

// Create Review
const createReview = catchAsync(async (req, res) => {
  const { rating, comment, professionalId } = req.body;

  const reviewerId = req.user?.id;
  if (!rating || !comment || !reviewerId || !professionalId) {
    throw new AppError(status.BAD_REQUEST, "rating, comment, and professionalId are required");
  }
  const result = await ReviewServices.createReview({ rating, comment, reviewerId, professionalId });

  res.status(status.CREATED).json({
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

// Get All Reviews
const getAllReviews = catchAsync(async (req, res) => {
  const reviews = await ReviewServices.getAllReviews();
  res.status(status.OK).json({ success: true, data: reviews });
});

// Get Single Review
const getReviewById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const review = await ReviewServices.getReviewById(id as string);
  res.status(status.OK).json({ success: true, data: review });
});

// Get Reviews by Professional
const getReviewsByProfessional = catchAsync(async (req, res) => {
  const { professionalId } = req.params;
  const reviews = await ReviewServices.getReviewsByProfessional(professionalId as string);
  res.status(status.OK).json({ success: true, data: reviews });
});

// Update Review
const updateReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const updated = await ReviewServices.updateReview(id as string, payload);
  res.status(status.OK).json({ success: true, message: "Review updated", data: updated });
});

// Delete Review
const deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ReviewServices.deleteReview(id as string);
  res.status(status.OK).json({ success: true, message: "Review deleted" });
});

export const ReviewController = {
  createReview,
  getAllReviews,
  getReviewById,
  getReviewsByProfessional,
  updateReview,
  deleteReview,
};
