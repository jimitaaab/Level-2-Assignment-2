import { Router } from "express";
import { issuesController } from "./issues.controller";

const route = Router()

route.post("/api/issues",issuesController.createIssues)

export const issuesRoute = route;