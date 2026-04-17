import { Router } from "express";
import { PlanRoutes } from "../modules/plan/plan.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.routes";
import { SubscriptionRoutes } from "../modules/subscription/subscription.route";
import { blogRouter } from "../modules/blogs/blog.route";
import { contactRoute } from "../modules/contact/contact.route";
import { subscriberRoutes } from "../modules/Subscriber/subscrober.route";
import { meetingRoutes } from "../modules/meeting/meeting.route";
import { MunicipalityRoutes } from "../modules/municipality/municipality.routes";
import { PropertyInfoRoutes } from "../modules/propertyInfo/propertyInfo.routes";
import { TeamRoutes } from "../modules/team/team.routes";
import { TaskRoutes } from "../modules/task/task.routes";
import { QARoutes } from "../modules/communityQA/qa.routes";
import { SuccessStoryRoutes } from "../modules/successStory/successStory.routes";
import { SettingsRoutes } from "../modules/settings/settings.routes";
import { LegalRoutes } from "../modules/legal/legal.routes";


const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/plans",
    route: PlanRoutes,
  },
  {
    path: "/subscriptions",
    route: SubscriptionRoutes,
  },

  {
    path: "/blogs",
    route: blogRouter,
  },
  {
    path: "/contacts",
    route: contactRoute,
  },
  {
    path: "/subscribers",
    route: subscriberRoutes,
  },
{
    path: "/mettings",
    route: meetingRoutes,
  },
  {
    path: "/municipalities",
    route: MunicipalityRoutes,
  },
  {
    path: "/property-infos",
    route: PropertyInfoRoutes,
  },
  {
    path: "/teams",
    route: TeamRoutes,
  },
  {
    path: "/tasks",
    route: TaskRoutes,
  },
  // ── New Modules ──────────────────────────────────────────
  {
    path: "/community-qa",
    route: QARoutes,
  },
  {
    path: "/success-stories",
    route: SuccessStoryRoutes,
  },
  {
    path: "/settings",
    route: SettingsRoutes,
  },
  {
    path: "/legal",
    route: LegalRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
