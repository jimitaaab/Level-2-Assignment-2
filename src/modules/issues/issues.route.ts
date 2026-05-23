import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from '../../middleware/auth';
import { USER_ROLE } from "../../types";

const route = Router()

route.post("/issues",auth(USER_ROLE.contributor,USER_ROLE.maintainer),issuesController.createIssues)
route.get("/issues",issuesController.getAllIssues)
route.get("/issues/:id",issuesController.getSingleissue)
route.patch("/issues/:id",auth(USER_ROLE.contributor, USER_ROLE.maintainer),issuesController.updateIssue)

export const issuesRoute = route;