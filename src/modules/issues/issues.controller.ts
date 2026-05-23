import type { Request, Response } from "express";
import { issueservice } from "./issues.service";

const createIssues = async (res:Response,req:Request) => {
  try {
    const result = await issueservice.createIssuesIntoDB(req.body);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
};

export const issuesController = {
  createIssues,
};
