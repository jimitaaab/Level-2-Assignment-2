
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

  const reporterMap = new Map(
    usersResult.rows.map((user) => [user.id, user])
  );
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

export const issueservice = {
  createIssuesIntoDB,
  getAllIssuesFromDB
};
