import type { NextFunction, Request, Response } from "express";
import { issueService } from "./issues.service";
import type { IUserInfo } from "./issues.interface";

const createIssues = async (req: Request, res: Response) => {
  const user = req.user as IUserInfo;
  console.log(user);
  try {
    const result = await issueService.createIssuesIntoDB(req.body, user);
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
    const result = await issueService.getAllIssuesFromDB(
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

const getSingleissue = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await issueService.getSingleIssuefromDB(id as string);

    res.status(200).json({
      success: true,
      message: "Issue retrived successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
};

const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  const { role, id: userId } = req.user as IUserInfo;
  const id = req.params.id;
  try {
    const result = await issueService.updateIssueToDB(req.body);
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
};

export const issuesController = {
  createIssues,
  getAllIssues,
  getSingleissue,
  updateIssue,
};
