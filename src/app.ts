import { authRouter } from './modules/auth/auth.route';
import express, {
  type Application,
  type Response,
  type Request,
} from "express";
import { issuesRoute } from './modules/issues/issues.route';


const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {

  res.status(200).json({
    messsage: "This is assignment 2",
    author: "Next Mission 2",
  });
});


app.use("/api/auth",authRouter)
app.use("/api",issuesRoute)



export default app;
