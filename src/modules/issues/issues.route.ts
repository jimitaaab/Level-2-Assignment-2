import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from '../../middleware/auth';

const route = Router()

route.post("/issues",auth(),issuesController.createIssues)

export const issuesRoute = route;