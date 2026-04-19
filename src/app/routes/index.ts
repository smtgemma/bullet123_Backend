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
import { TaskRoutes } from "../modules/task/task.routes";
import { BudgetRoutes } from "../modules/budget/budget.routes";
import { MessageRoutes } from "../modules/message/message.routes";
import { DocumentRoutes } from "../modules/document/document.routes";
import { ProgressPhotoRoutes } from "../modules/progressPhoto/progressPhoto.routes";
import { reviewRoute } from "../modules/review/review.route";

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
    path: "/tasks",
    route: TaskRoutes,
  },
  {
    path: "/budgets",
    route: BudgetRoutes,
  },
  {
    path: "/messages",
    route: MessageRoutes,
  },
  {
    path: "/documents",
    route: DocumentRoutes,
  },
  {
    path: "/progress-photos",
    route: ProgressPhotoRoutes,
  },
  {
    path: "/reviews",
    route: reviewRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
