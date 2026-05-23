import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
import type { Roles } from "../types";




const auth = (...roles: Roles[]) => {
    
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "unauthorized access!!!",
      });
    }

    const decoded = jwt.verify(
      token as string,
      config.accessToken_key as string,
    ) as JwtPayload;

    const userInfo = await pool.query(
      `
            SELECT * FROM users WHERE email = $1    
        `,
      [decoded.email],
    );

    const user = userInfo.rows[0];

    if (userInfo.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found!!!",
      });
    }

    if (roles.length && !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden!!!",
      });
    }

    req.user = decoded;

    next();
  };
};

export default auth;
