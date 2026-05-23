import type { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/send.response";

const regUser = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const result = await authService.createUserIntoDB(req.body);
    if (result.rows.length === 0) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Registration failed",
        error: Error,
      });
    }
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    next(error);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  try {
    const result = await authService.loginUserIntoDB(
      email as string,
      password as string,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successfull",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const authController = {
  regUser,
  loginUser,
};
