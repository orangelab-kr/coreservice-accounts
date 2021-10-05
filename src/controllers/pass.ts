import { PassProgramModel, PassModel, Prisma, UserModel } from '@prisma/client';
import dayjs from 'dayjs';
import { $$$, Joi, prisma, RESULT } from '..';

export class Pass {
  public static readonly defaultInclude: Prisma.PassModelInclude = {
    passProgram: true,
  };

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

  public static async assignmentPassProgram(
    user: UserModel,
    passProgram: PassProgramModel,
    props: { autoRenew: boolean }
  ): Promise<() => Prisma.Prisma__PassModelClient<PassModel>> {
    const { autoRenew } = await Joi.object({
      autoRenew: Joi.boolean().required(),
    }).validateAsync(props);
    const { userId } = user;
    const { passProgramId, validity } = passProgram;
    const data: Prisma.PassModelUncheckedCreateInput = {
      userId,
      passProgramId,
      autoRenew,
    };

    const include = Pass.defaultInclude;
    if (validity) data.expiredAt = dayjs().add(validity, 'ms').toDate();
    return () => prisma.passModel.create({ data, include });
  }

  // public static async purchasePassProgram(
  //   user: UserModel,
  //   passProgram: PassProgramModel,
  //   props: { autoRenew }
  // ): Promise<void> {}
}
