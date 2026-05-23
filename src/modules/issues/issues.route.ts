import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from '../../middleware/auth';

const route = Router()

route.post("/issues",auth("contributor", "maintainer"),issuesController.createIssues)



export const issuesRoute = route;