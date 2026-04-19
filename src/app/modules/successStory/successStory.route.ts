import { Router } from "express";
import auth from "../../middlewares/auth";
import { SuccessStoryController } from "./successStory.controller";

const router = Router();

// Create
router.post(
  "/add",
  auth(), // Let any authenticated user add their success story
  SuccessStoryController.createSuccessStory
);

// Get all across the platform (optional, if needed for admin etc.)
router.get("/all", SuccessStoryController.getAllSuccessStories);

// Get my own success stories
router.get("/my-stories", auth(), SuccessStoryController.getMySuccessStories);

// Get success stories of a specific professional
router.get("/professional/:professionalId", SuccessStoryController.getSuccessStoriesByProfessional);

// Get details of a single success story
router.get("/:id", SuccessStoryController.getSuccessStoryById);

// Update
router.patch(
  "/:id",
  auth(),
  SuccessStoryController.updateSuccessStory
);

// Delete
router.delete("/:id", auth(), SuccessStoryController.deleteSuccessStory);

export const SuccessStoryRoutes = router;
