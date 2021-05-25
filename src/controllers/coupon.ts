import { CouponModel, Prisma, PrismaPromise, UserModel } from '@prisma/client';
import { CouponGroup, Joi } from '..';
import {
  $$$,
  Database,
  getPlatformClient,
  InternalError,
  OPCODE,
} from '../tools';

const { prisma } = Database;

interface OpenApiDiscount {
  discountId: string;
  discountGroupId: string;
  expiredAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Coupon {
  public static async getCoupons(
    user: UserModel,
    props: {
      take?: number;
      skip?: number;
      search?: string;
      showUsed?: boolean;
      orderByField?: 'createdAt' | 'usedAt' | 'expiredAt';
      orderBySort?: 'asc' | 'desc';
    }
  ): Promise<{ coupons: CouponModel[]; total: number }> {
    const schema = Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().default('').allow('').optional(),
      showUsed: Joi.boolean().default(true).optional(),
      orderByField: Joi.string()
        .valid('createdAt', 'usedAt', 'expiredAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
    });

    const { take, skip, search, showUsed, orderByField, orderBySort } =
      await schema.validateAsync(props);

    const { userId } = user;
    const orderBy = { [orderByField]: orderBySort };
    const where: Prisma.CouponModelWhereInput = {
      userId,
      OR: [
        { couponId: search },
        { couponGroupId: search },
        { couponGroup: { name: { contains: search } } },
        { couponGroup: { description: { contains: search } } },
      ],
    };

    if (!showUsed) where.usedAt = null;
    const [total, coupons] = await prisma.$transaction([
      prisma.couponModel.count({ where }),
      prisma.couponModel.findMany({
        where,
        take,
        skip,
        orderBy,
      }),
    ]);

    return { total, coupons };
  }

  public static async enrollCoupon(
    user: UserModel,
    code: string
  ): Promise<() => Prisma.Prisma__CouponModelClient<CouponModel>> {
    const { userId } = user;
    const couponGroup = await CouponGroup.getCouponGroupByCodeOrThrow(code);
    const { couponGroupId, limit, discountGroupId } = couponGroup;

    if (limit) {
      const duplicateCount = await $$$(
        this.getCouponDuplicateCount(user, couponGroupId)
      );

      if (duplicateCount >= limit) {
        throw new InternalError(
          `해당 쿠폰은 ${limit}회만 사용 가능합니다.`,
          OPCODE.EXCESS_LIMITS
        );
      }
    }

    let discount: OpenApiDiscount | undefined;
    if (discountGroupId) {
      discount = await this.generateDiscountId(discountGroupId);
    }

    const discountId = discount ? discount.discountId : null;
    const expiredAt = discount ? new Date(discount.expiredAt) : null;
    return () =>
      prisma.couponModel.create({
        data: {
          userId,
          couponGroupId,
          discountId,
          expiredAt,
        },
      });
  }

  public static async generateDiscountId(
    discountGroupId: string
  ): Promise<OpenApiDiscount> {
    const { discount } = await getPlatformClient()
      .get(`discount/${discountGroupId}/generate`)
      .json<{ opcode: number; discount: OpenApiDiscount }>();

    return discount;
  }

  public static async getCouponDuplicateCount(
    user: UserModel,
    couponGroupId: string
  ): Promise<() => PrismaPromise<number>> {
    const { userId } = user;
    return () => prisma.couponModel.count({ where: { userId, couponGroupId } });
  }
}
