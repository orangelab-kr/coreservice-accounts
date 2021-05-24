import 'express';
import { UserModel } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
      user: UserModel;
    }
  }
}
