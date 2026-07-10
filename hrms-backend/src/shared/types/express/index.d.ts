import { Role } from "../../constants/roles";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        employeeId: string;
      };
      validated?: {
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
