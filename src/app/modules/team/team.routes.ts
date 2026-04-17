import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { TeamController } from "./team.controller";
import { TeamValidation } from "./team.validation";

const router = Router();

router.post(
  "/create",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN),
  validateRequest(TeamValidation.createTeamValidationSchema),
  TeamController.createTeam
);

router.get(
  "/my-teams",
  auth(UserRole.MUNICIPALITY),
  TeamController.getMyTeams
);

router.get(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN),
  TeamController.getSingleTeam
);

router.patch(
  "/:id/add-members",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN),
  validateRequest(TeamValidation.addMembersValidationSchema),
  TeamController.addMembersToTeam
);

router.delete(
  "/:id/members/:memberId",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN),
  TeamController.removeMemberFromTeam
);

router.delete(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN),
  TeamController.deleteTeam
);

export const TeamRoutes = router;
