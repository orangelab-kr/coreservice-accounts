import {
  PassModel,
  PassProgramModel,
  Prisma,
  PrismaPromise,
  UserModel,
} from '@prisma/client';
import dayjs from 'dayjs';
import { v1 } from 'uuid';
import { $$$, getCoreServiceClient, Joi, prisma, RESULT, User } from '..';

export interface CouponModel {
  couponId: string;
  userId: string;
  couponGroupId: string;
  couponGroup: CouponGroupModel;
  usedAt: null;
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
}

export interface CouponGroupModel {
  couponGroupId: string;
  type: 'ONETIME' | 'LONGTIME';
  name: string;
  description: string;
  validity: number;
  limit: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
}

export class Pass {
  public static readonly defaultInclude: Prisma.PassModelInclude = {
    passProgram: true,
  };

  public static async getExtendablePass(
    props: {
      interval?: number;
      remaining?: number;
    } = {},
    withUser = false
  ): Promise<() => PrismaPromise<PassModel[]>> {
    const { interval, remaining } = { interval: 3, remaining: 7, ...props };
    const remainingDate = dayjs().add(remaining, 'd');
    const intervalDate = dayjs().subtract(interval, 'd');
    return () =>
      prisma.passModel.findMany({
        include: { ...Pass.defaultInclude, user: withUser },
        where: {
          requestedAt: { lte: intervalDate.toDate() },
          expiredAt: {
            gte: dayjs().toDate(),
            lte: remainingDate.toDate(),
          },
        },
      });
  }

  public static async getPass(
    passId: string
  ): Promise<() => Prisma.Prisma__PassModelClient<PassModel | null>> {
    return () =>
      prisma.passModel.findFirst({
        where: { passId },
        include: Pass.defaultInclude,
      });
  }

  public static async getPassOrThrow(passId: string): Promise<PassModel> {
    const pass = await $$$(Pass.getPass(passId));
    if (!pass) throw RESULT.CANNOT_FIND_PASS_GROUP();
    return pass;
  }

  public static async getPasses(
    props?: {
      take?: number;
      skip?: number;
      search?: string;
      userId?: string;
      passProgramId?: string;
      orderByField?: 'createdAt' | 'expiredAt';
      orderBySort?: 'asc' | 'desc';
    },
    user?: UserModel
  ): Promise<{ total: number; passes: PassModel[] }> {
    const where: Prisma.PassModelWhereInput = {};
    const {
      take,
      skip,
      search,
      userId,
      passProgramId,
      orderByField,
      orderBySort,
    } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().allow('').optional(),
      userId: Joi.string().uuid().optional(),
      passProgramId: Joi.string().uuid().optional(),
      orderByField: Joi.string()
        .valid('createdAt', 'expiredAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
    }).validateAsync(props);

    if (search) {
      where.OR = [
        { passId: { contains: search } },
        { passProgramId: { contains: search } },
        { userId: { contains: search } },
        { passProgram: { name: { contains: search } } },
        { passProgram: { description: { contains: search } } },
        { passProgram: { couponGroupId: { contains: search } } },
      ];
    }

    if (userId) where.userId = userId;
    if (passProgramId) where.passProgramId = passProgramId;
    if (user) where.userId = user.userId;
    const include = Pass.defaultInclude;
    const orderBy = { [orderByField]: orderBySort };
    const [total, passes] = await prisma.$transaction([
      prisma.passModel.count({ where }),
      prisma.passModel.findMany({ where, take, skip, orderBy, include }),
    ]);

    return { total, passes };
  }

  private static async generateCoupon(
    user: UserModel,
    couponGroupId: string
  ): Promise<CouponModel> {
    const { userId } = user;
    const { coupon } = await getCoreServiceClient('payments')
      .post(`users/${userId}/coupons`, { json: { couponGroupId } })
      .json<{ opcode: number; coupon: CouponModel }>();

    return coupon;
  }

  private static async deleteCoupon(
    user: UserModel,
    couponId: string
  ): Promise<void> {
    const { userId } = user;
    await getCoreServiceClient('payments')
      .delete(`users/${userId}/coupons/${couponId}`)
      .json<{ opcode: number }>();
  }

  public static async createPass(
    user: UserModel,
    passProgram: PassProgramModel,
    props: { passId?: string; autoRenew: boolean }
  ): Promise<() => Prisma.Prisma__PassModelClient<PassModel>> {
    let couponId;
    const { userId } = user;
    const { passId, autoRenew } = props;
    const { passProgramId, validity, couponGroupId } = passProgram;
    if (couponGroupId) {
      const coupon = await Pass.generateCoupon(user, couponGroupId);
      couponId = coupon.couponId;
    }

    const data: Prisma.PassModelUncheckedCreateInput = {
      passId,
      userId,
      couponGroupId,
      couponId,
      passProgramId,
      autoRenew,
    };

    const include = Pass.defaultInclude;
    if (validity) data.expiredAt = dayjs().add(validity, 's').toDate();
    return () => prisma.passModel.create({ data, include });
  }

  public static async extendPass(
    pass: PassModel & { passProgram?: PassProgramModel; user?: UserModel },
    free = false
  ): Promise<() => Prisma.Prisma__PassModelClient<PassModel>> {
    const { passId, passProgram, couponId, userId } = pass;
    if (!passProgram) throw RESULT.INVALID_ERROR();
    const user = pass.user || (await User.getUserOrThrow(userId));
    const { name, price, passProgramId, couponGroupId } = passProgram;
    if (!passProgram.isSale) throw RESULT.PASS_PROGRAM_IS_NOT_SALE();
    if (!free && price && price > 0) {
      const json = {
        userId,
        name: `패스 / ${name} (연장)`,
        properties: { coreservice: { passId, passProgramId } },
        amount: price,
        required: true,
      };

      await getCoreServiceClient('payments').post(`records`, { json }).json();
    }

    const expiredAt = Pass.caclulateExpiredAt(pass);
    const data: Prisma.PassModelUpdateInput = { expiredAt };
    if (couponId) await Pass.deleteCoupon(user, couponId).catch(() => null);
    if (couponGroupId) {
      const { couponId } = await Pass.generateCoupon(user, couponGroupId);
      data.couponGroupId = couponGroupId;
      data.couponId = couponId;
    }

    const where = { passId };
    const include = Pass.defaultInclude;
    return () => prisma.passModel.update({ where, data, include });
  }

  public static async modifyPass(
    pass: PassModel & { passProgram?: PassProgramModel },
    props: { autoRenew?: boolean; requestedAt?: Date }
  ): Promise<() => Prisma.Prisma__PassModelClient<PassModel>> {
    const { passId } = pass;
    const where = { passId };
    const data = await Joi.object({
      autoRenew: Joi.boolean().optional(),
      requestedAt: Joi.date().optional(),
    }).validateAsync(props);
    const include = Pass.defaultInclude;
    return () => prisma.passModel.update({ where, data, include });
  }

  private static caclulateExpiredAt(
    pass: PassModel & { passProgram?: PassProgramModel }
  ): Date | null {
    if (!pass.passProgram) throw RESULT.INVALID_ERROR();
    const { validity } = pass.passProgram;
    if (!validity) return null;
    const expiredAt = dayjs(pass.expiredAt);
    return pass.expiredAt && expiredAt.isBefore(dayjs())
      ? dayjs().add(validity, 's').toDate()
      : expiredAt.add(validity, 's').toDate();
  }

  public static async generatePassId(): Promise<string> {
    let passId;
    while (true) {
      passId = v1();
      const pass = await prisma.passModel.findFirst({ where: { passId } });
      if (!pass) break;
    }

    return passId;
  }
}
