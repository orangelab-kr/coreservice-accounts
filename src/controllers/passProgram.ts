import { PassProgramModel, Prisma, UserModel } from '@prisma/client';
import { Pass } from '.';
import { $$$, getCoreServiceClient, Joi, prisma, RESULT } from '..';

export class PassProgram {
  public static async getPassProgram(
    passProgramId: string
  ): Promise<
    () => Prisma.Prisma__PassProgramModelClient<PassProgramModel | null>
  > {
    return () =>
      prisma.passProgramModel.findFirst({ where: { passProgramId } });
  }

  public static async getPassProgramOrThrow(
    passProgramId: string
  ): Promise<PassProgramModel> {
    const passProgram = await $$$(PassProgram.getPassProgram(passProgramId));
    if (!passProgram) throw RESULT.CANNOT_FIND_PASS_GROUP();
    return passProgram;
  }

  public static async getPassPrograms(
    props?: {
      take?: number;
      skip?: number;
      search?: string;
      orderByField?: 'name' | 'createdAt';
      orderBySort?: 'asc' | 'desc';
    },
    onlySale = true
  ): Promise<{ total: number; passPrograms: PassProgramModel[] }> {
    const where: Prisma.PassProgramModelWhereInput = {};
    const { take, skip, search, orderByField, orderBySort } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().allow('').optional(),
      userId: Joi.string().uuid().optional(),
      passProgramId: Joi.string().uuid().optional(),
      orderByField: Joi.string()
        .valid('name', 'createdAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
    }).validateAsync(props);
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { couponGroupId: { contains: search } },
      ];
    }

    if (onlySale) where.isSale = true;
    const orderBy = { [orderByField]: orderBySort };
    const [total, passPrograms] = await prisma.$transaction([
      prisma.passProgramModel.count({ where }),
      prisma.passProgramModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, passPrograms };
  }

  public static async deletePassProgram(
    passProgram: PassProgramModel
  ): Promise<() => Prisma.Prisma__PassProgramModelClient<PassProgramModel>> {
    const { passProgramId } = passProgram;
    const count = await prisma.passModel.count({ where: { passProgramId } });
    if (count > 0) throw RESULT.PASS_PROGRAM_HAS_USING({ args: [`${count}`] });
    return () => prisma.passProgramModel.delete({ where: { passProgramId } });
  }

  public static async createPassProgram(props: {
    name: string;
    description?: string;
    isSale: boolean;
    couponGroupId?: string;
    validity?: number;
    allowRenew: boolean;
    price?: number;
  }): Promise<() => Prisma.Prisma__PassProgramModelClient<PassProgramModel>> {
    const {
      name,
      description,
      isSale,
      couponGroupId,
      validity,
      allowRenew,
      price,
    } = await Joi.object({
      name: Joi.string().min(2).max(16).required(),
      description: Joi.string().allow('').optional(),
      isSale: Joi.boolean().required(),
      couponGroupId: Joi.string().uuid().allow(null).optional(),
      validity: Joi.number().allow(null).optional(),
      allowRenew: Joi.boolean().required(),
      price: Joi.number().allow(null).optional(),
    }).validateAsync(props);
    if (couponGroupId) {
      await getCoreServiceClient('payments')
        .get(`couponGroups/${couponGroupId}`)
        .json();
    }

    return () =>
      prisma.passProgramModel.create({
        data: {
          name,
          description,
          isSale,
          couponGroupId,
          validity,
          allowRenew,
          price,
        },
      });
  }

  public static async modifyPassProgram(
    passProgram: PassProgramModel,
    props: {
      name: string;
      description?: string;
      isSale: boolean;
      couponGroupId?: string;
      validity?: number;
      allowRenew: boolean;
      price?: number;
    }
  ): Promise<() => Prisma.Prisma__PassProgramModelClient<PassProgramModel>> {
    const { passProgramId } = passProgram;
    const {
      name,
      description,
      isSale,
      couponGroupId,
      validity,
      allowRenew,
      price,
    } = await Joi.object({
      name: Joi.string().min(2).max(16).optional(),
      description: Joi.string().allow('').optional(),
      isSale: Joi.boolean().optional(),
      couponGroupId: Joi.string().uuid().allow(null).optional(),
      validity: Joi.number().allow(null).optional(),
      allowRenew: Joi.boolean().optional(),
      price: Joi.number().allow(null).optional(),
    }).validateAsync(props);
    if (couponGroupId && passProgram.couponGroupId !== couponGroupId) {
      await getCoreServiceClient('payments')
        .get(`couponGroups/${couponGroupId}`)
        .json();
    }

    return () =>
      prisma.passProgramModel.update({
        where: { passProgramId },
        data: {
          name,
          description,
          isSale,
          couponGroupId,
          validity,
          allowRenew,
          price,
        },
      });
  }

  public static async purchasePassProgram(
    user: UserModel,
    passProgram: PassProgramModel,
    props: { autoRenew: boolean }
  ): Promise<any> {
    const { userId } = user;
    const { passProgramId, isSale, price, name } = passProgram;
    const { autoRenew } = await Joi.object({
      autoRenew: Joi.boolean().required(),
    }).validateAsync(props);
    if (!isSale) throw RESULT.PASS_PROGRAM_IS_NOT_SALE();
    const passId = await Pass.generatePassId();
    if (price && price > 0) {
      const json = {
        userId,
        name: `패스 / ${name} (구매)`,
        properties: { coreservice: { passId, passProgramId } },
        amount: price,
        required: true,
      };

      await getCoreServiceClient('payments').post(`records`, { json }).json();
    }

    const options = { passId, autoRenew };
    return Pass.createPass(user, passProgram, options);
  }
}
