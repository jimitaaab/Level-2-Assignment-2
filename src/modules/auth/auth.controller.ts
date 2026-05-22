import type { Request, Response } from "express";
import { authService } from "./auth.service";

const regUser = async (req: Request, res: Response) => {
  try {
    // console.log("Controller path");
    const result = await authService.createUserIntoDB(req.body);
    // console.log(result)
    res.status(202).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
};

export const authController = {
  regUser,
};
