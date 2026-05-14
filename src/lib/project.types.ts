import { UserRole } from "./auth.types";

export interface IProject {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
}

export interface IProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: UserRole;
  createdAt: string;
}

export interface IRequestProject {
  id: string;
  name: string;
  subdomain: string;
}

// Extend Express Request — every route handler gets req.project typed.
declare global {
  namespace Express {
    interface Request {
      project?: IRequestProject;
    }
  }
}
