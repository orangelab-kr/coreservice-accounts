import { Router } from 'express';
import { $$$, Coupon, OPCODE, Wrapper } from '..';

export function getCouponsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const { total, coupons } = await Coupon.getCoupons(req.user, req.query);
      res.json({ opcode: OPCODE.SUCCESS, coupons, total });
    })
  );

  router.post(
    '/',
    Wrapper(async (req, res) => {
      const coupon = await $$$(Coupon.enrollCoupon(req.user, req.body.code));
      res.json({ opcode: OPCODE.SUCCESS, coupon });
    })
  );

  return router;
}
