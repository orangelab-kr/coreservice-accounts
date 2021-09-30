import 'express';
import { CouponModel, UserModel } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
      coupon: CouponModel;
      user: UserModel;
      internal: {
        sub: string;
        iss: string;
        aud: string;
        iat: Date;
        exp: Date;
        sessionId: string;
        user: UserModel;
        session: SessionModel;
      };
    }
  }
}
