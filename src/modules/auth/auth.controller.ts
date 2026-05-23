import type { Request, Response } from "express";
import { authService } from "./auth.service";

const regUser = async (req: Request, res: Response) => {
  try {
    // console.log("Controller path");
    const result = await authService.createUserIntoDB(req.body);
    // console.log(result)
    res.status(201).json({
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

 const loginUser = async (req: Request, res: Response) => 
 {
  const {email, password} = req.body;
  try {
    const result = await authService.loginUserIntoDB(email as string, password as string)
    const {token ,user} = result;
    //console.log(accessToken ,user);
    res.status(200).json(
      {
        success: true,
        message:"Login successfull",
        data: result
      }
    )

    
  } catch (error:any) {
    res.status(500).json(
      {
        message: error.message,
        error: error
      }
    )
  }

 }

export const authController = {
  regUser,
  loginUser
};
