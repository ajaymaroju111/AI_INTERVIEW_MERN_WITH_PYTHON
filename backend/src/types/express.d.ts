import type z from "zod";
import type { getUserProfileSchema } from "../validators/user/user.schema.ts";
import { IUser } from "./user.interface.ts";
import type { AuthUser } from "../validators/auth/authtoken.schema.ts";
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}


type GetProfileParams = z.infer<typeof getUserProfileSchema>["params"];

declare module "express-serve-static-core" {
  interface Request {
    params: GetProfileParams;
  }
}


declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}