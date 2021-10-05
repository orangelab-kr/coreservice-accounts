import { CouponModel, UserModel } from '@prisma/client';
import 'express';

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
      coupon: CouponModel;
      user: UserModel;
      passProgram: PassProgramModel;
      pass: PassProgram;
      internal: {
        sub: string;
        iss: string;
        aud: string;
        iat: Date;
        exp: Date;
        sessionId: string;
        user: UserModel;
        session: SessionModel;
        passProgram: PassProgramModel;
        pass: PassProgram;
      };
    }
  }
}
