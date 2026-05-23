import { pool } from "../../db";
import type { ICreateIssue, IUserInfo } from "./issues.interface";

const createIssuesIntoDB = async (payload: ICreateIssue, user: IUserInfo) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
        INSERT INTO issues (title, description, type, reporter_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *     
    `,
    [title, description, type, user.id],
  );

  if (result.rows.length === 0) {
    throw new Error("Issue cannot be created!!");
  }

  return result;
};

const getAllIssuesFromDB = async (
  sort?: string,
  type?: string,
  status?: string,
) => {
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
    [reporterIds],
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
    updated_at: issue.updated_at,
  }));

  return result;
};

const getSingleIssuefromDB = async (id: string) => {
  const issue = await pool.query(
    `
        SELECT * FROM issues where id = $1
    `,
    [id],
  );

  if (issue.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const reporterId = issue.rows[0].reporter_id;

  const reporterDetails = await pool.query(
    `
    SELECT id, name, role FROM users WHERE id = $1
    `,
    [reporterId],
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
    updated_at: issue.rows[0].updated_at,
  };
  return result;
};

const updateIssueIntoDB = async (
  id: string,
  userId: number,
  role: string,
  payload: ICreateIssue,
) => {

  const { title, description, type } = payload;

  const issueInfo = await pool.query(
    `
      SELECT * FROM issues WHERE id = $1
    `,
    [id],
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
    [title, description, type, id],
  );

  return result.rows[0];
};

export const issueService = {
  createIssuesIntoDB,
  getAllIssuesFromDB,
  getSingleIssuefromDB,
  updateIssueIntoDB,
};
