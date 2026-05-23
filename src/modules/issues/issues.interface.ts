export interface ICreateIssue {
  title: string;
  description: string;
  type: "bug" | "feature_request";
}

export interface IUserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
}
