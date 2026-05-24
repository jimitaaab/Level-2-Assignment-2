
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET,
  accessToken_key: process.env.ACCESSTOKEN_KEY
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(20),
      email VARCHAR(30) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(12) DEFAULT 'contributor',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      )
      
      `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,

        description TEXT NOT NULL
        CHECK(LENGTH(description) >= 20),

        type VARCHAR(30) NOT NULL
        CHECK(type IN ('bug', 'feature_request')),

        status VARCHAR(30) DEFAULT 'open'
        CHECK(status IN ('open', 'in_progress', 'resolved')),
        
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
      `);
    console.log("Both databases created successfully!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users(name ,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor'))
    RETURNING *
    `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (email, password) => {
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
    `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("User Not Found");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid credentials!!");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.accessToken_key, {
    expiresIn: "1d"
  });
  delete user.password;
  return { token, user };
};
var authService = {
  createUserIntoDB,
  loginUserIntoDB
};

// src/utility/send.response.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var send_response_default = sendResponse;

// src/modules/auth/auth.controller.ts
var regUser = async (req, res, next) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    if (result.rows.length === 0) {
      send_response_default(res, {
        statusCode: 404,
        success: false,
        message: "Registration failed",
        error: Error
      });
    }
    send_response_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
var loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await authService.loginUserIntoDB(
      email,
      password
    );
    send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successfull",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var authController = {
  regUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.regUser);
router.post("/logIn", authController.loginUser);
var authRouter = router;

// src/app.ts
import express from "express";

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssuesIntoDB = async (payload, user) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
        INSERT INTO issues (title, description, type, reporter_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *     
    `,
    [title, description, type, user.id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue cannot be created!!");
  }
  return result;
};
var getAllIssuesFromDB = async (sort, type, status) => {
  const order = sort === "oldest" ? "ASC" : "DESC";
  let query = `SELECT * FROM issues`;
  const values = [];
  const conditions = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += ` ORDER BY created_at ${order}`;
  const issuesResult = await pool.query(query, values);
  const issues = issuesResult.rows;
  if (issues.length === 0) {
    throw new Error("No issues found");
  }
  const reporterIds = issues.map((issue) => issue.reporter_id);
  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  const reporterMap = new Map(usersResult.rows.map((user) => [user.id, user]));
  const result = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap.get(issue.reporter_id),
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
  return result;
};
var getSingleIssuefromDB = async (id) => {
  const issue = await pool.query(
    `
        SELECT * FROM issues where id = $1
    `,
    [id]
  );
  if (issue.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const reporterId = issue.rows[0].reporter_id;
  const reporterDetails = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id = $1
    `,
    [reporterId]
  );
  if (reporterDetails.rows.length === 0) {
    throw new Error("Reporter not found");
  }
  const user = reporterDetails.rows[0];
  const result = {
    id: issue.rows[0].id,
    title: issue.rows[0].title,
    description: issue.rows[0].description,
    type: issue.rows[0].type,
    status: issue.rows[0].status,
    reporter: user,
    created_at: issue.rows[0].created_at,
    updated_at: issue.rows[0].updated_at
  };
  return result;
};
var updateIssueIntoDB = async (id, userId, role, payload) => {
  const { title, description, type } = payload;
  const issueInfo = await pool.query(
    `
      SELECT * FROM issues WHERE id = $1
    `,
    [id]
  );
  const issue = issueInfo.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  if (role === "contributor" && userId !== issue.reporter_id) {
    throw new Error("Unauthorized Access!");
  }
  if (role === "contributor" && issue.status !== "open") {
    throw new Error("Issue is already in progress");
  }
  const result = await pool.query(
    `
      UPDATE issues
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        status = 'in_progress',
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `,
    [title, description, type, id]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `
      DELETE FROM issues WHERE id = $1
  `,
    [id]
  );
  return result;
};
var issueService = {
  createIssuesIntoDB,
  getAllIssuesFromDB,
  getSingleIssuefromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssues = async (req, res, next) => {
  const user = req.user;
  try {
    const result = await issueService.createIssuesIntoDB(req.body, user);
    send_response_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
var getAllIssues = async (req, res, next) => {
  const { sort, type, status } = req.query;
  try {
    const result = await issueService.getAllIssuesFromDB(
      sort,
      type,
      status
    );
    send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleissue = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await issueService.getSingleIssuefromDB(id);
    send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue = async (req, res, next) => {
  const { role, id: userId } = req.user;
  const id = req.params.id;
  try {
    const result = await issueService.updateIssueIntoDB(
      id,
      userId,
      role,
      req.body
    );
    send_response_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      error: Error
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await issueService.deleteIssueFromDB(id);
    if (result.rowCount === 0) {
      send_response_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found to delete",
        error: Error
      });
    }
    send_response_default(res, {
      statusCode: 204,
      success: true,
      message: "Issue Deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var issuesController = {
  createIssues,
  getAllIssues,
  getSingleissue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({
        success: false,
        message: "unauthorized access!!!"
      });
    }
    const decoded = jwt2.verify(
      token,
      config_default.accessToken_key
    );
    const userInfo = await pool.query(
      `
            SELECT * FROM users WHERE email = $1    
        `,
      [decoded.email]
    );
    const user = userInfo.rows[0];
    if (userInfo.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found!!!"
      });
    }
    if (roles.length && !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden!!!"
      });
    }
    req.user = decoded;
    next();
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issues/issues.route.ts
var route = Router2();
route.post("/issues", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssues);
route.get("/issues", issuesController.getAllIssues);
route.get("/issues/:id", issuesController.getSingleissue);
route.patch("/issues/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.updateIssue);
route.delete("/issues/:id", auth_default(USER_ROLE.maintainer), issuesController.deleteIssue);
var issuesRoute = route;

// src/middleware/globalErrorHandle.ts
var globalError = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandle_default = globalError;

// src/app.ts
import cors from "cors";
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.get("/", (req, res) => {
  res.status(200).json({
    messsage: "This is assignment 2",
    author: "Next Mission 2"
  });
});
app.use("/api/auth", authRouter);
app.use("/api", issuesRoute);
app.use(globalErrorHandle_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening On port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map