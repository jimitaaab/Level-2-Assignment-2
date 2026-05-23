import type { Request, Response } from "express";
import { issueservice } from "./issues.service";
import type { IUserInfo } from "./issues.interface";

const createIssues = async (req: Request, res: Response) => {
  const user = req.user as IUserInfo;
  console.log(user);
  try {
    const result = await issueservice.createIssuesIntoDB(req.body, user);
    console.log(result);
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};


const getAllIssues = async (req: Request, res: Response) => {
 
    const { sort, type, status } = req.query;
  try {
    const result = await issueservice.getAllIssuesFromDB(
      sort as string,
      type as string,
      status as string,
    );
    res.status(200).json({
      success: true,
      //message: "",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const issuesController = {
  createIssues,
  getAllIssues
};
