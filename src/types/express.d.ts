export type AuthUser = {
  id: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
