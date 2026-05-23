import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from '../../middleware/auth';

const route = Router()

route.post("/issues",auth("contributor", "maintainer"),issuesController.createIssues)
route.get("/issues",issuesController.getAllIssues)
route.get("/issues/:id",issuesController.getSingleissue)
route.patch("/issues/:id",auth("contributor", "maintainer"),issuesController.updateIssue)

export const issuesRoute = route;