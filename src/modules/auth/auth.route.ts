import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router()

router.post('/signup', authController.regUser);
router.post('/logIn', authController.loginUser);

export const authRouter = router;