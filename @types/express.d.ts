import {
  CouponModel,
  PassModel,
  PassProgramModel,
  UserModel,
} from '@prisma/client';
import 'express';

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
      coupon: CouponModel;
      user: UserModel;
      notification: NotificationModels;
      passProgram: PassProgramModel;
      pass: PassModel;
      internal: {
        sub: string;
        iss: string;
        aud: string;
        iat: Date;
        exp: Date;
        sessionId: string;
        user: UserModel;
        session: SessionModel;
        notification: NotificationModels;
        passProgram: PassProgramModel;
        pass: PassProgram;
      };
    }
  }
}
