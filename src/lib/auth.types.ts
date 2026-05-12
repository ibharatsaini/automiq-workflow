
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface IUser {
  id:           string;
  email:        string;
  passwordHash: string;
  createdAt:    string;
}


export interface IJwtPayload {
  sub:   string;   // user id
  email: string;
  iat?:  number;
  exp?:  number;
}

export interface IAuthUser {
  id:    string;
  email: string;
  role?: UserRole;  
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
