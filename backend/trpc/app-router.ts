import { createTRPCRouter } from "./create-context";
import { accountRouter } from "./account";
import { tutorRouter } from "./tutor";
import { subscriptionRouter } from "./subscription";
import { studyRouter } from "./study";
import { reportsRouter } from "./reports";

export const appRouter = createTRPCRouter({
  account: accountRouter,
  tutor: tutorRouter,
  subscription: subscriptionRouter,
  study: studyRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
