import { PointModel, PointType, Prisma, UserModel } from '@prisma/client';
import dayjs from 'dayjs';
import { Joi, prisma } from '..';

export class Point {
  public static async getPointByMonth(
    user: UserModel,
    subtractMonth = 0
  ): Promise<number> {
    const lastMonth = dayjs().subtract(subtractMonth, 'month');
    const startedAt = lastMonth.startOf('month').toDate();
    const endedAt = lastMonth.endOf('month').toDate();
    return Point.getTotalPoint(user, { startedAt, endedAt });
  }

  public static async getPoints(
    user: UserModel,
    props: {
      take?: number;
      skip?: number;
      search?: string;
      type?: string | string[];
      orderByField?: 'point' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
    }
  ): Promise<{ total: number; points: PointModel[] }> {
    const { userId } = user;
    const where: Prisma.PointModelWhereInput = { userId };
    const { take, skip, search, type, orderByField, orderBySort } =
      await Joi.object({
        take: Joi.number().default(10).optional(),
        skip: Joi.number().default(0).optional(),
        search: Joi.string().allow('').optional(),
        type: Joi.array()
          .items(Joi.string().valid(...Object.keys(PointType)))
          .single()
          .optional(),
        orderByField: Joi.string()
          .valid('point', 'createdAt', 'updatedAt')
          .default('createdAt')
          .optional(),
        orderBySort: Joi.string()
          .valid('asc', 'desc')
          .default('desc')
          .optional(),
      }).validateAsync(props);
    if (search) where.pointId = { contains: search };
    if (type) where.type = { in: type };

    const orderBy = { [orderByField]: orderBySort };
    const [total, points] = await prisma.$transaction([
      prisma.pointModel.count({ where }),
      prisma.pointModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, points };
  }

  public static async increasePoint(
    user: UserModel,
    props: { point: number; type: PointType }
  ): Promise<PointModel> {
    const { userId } = user;
    const { point, type } = await Joi.object({
      point: Joi.number().default(1).optional(),
      type: Joi.string()
        .valid(...Object.keys(PointType))
        .required(),
    }).validateAsync(props);
    return prisma.pointModel.create({
      data: { userId, point, type },
    });
  }

  public static async getTotalPoint(
    user: UserModel,
    props?: { startedAt?: Date; endedAt?: Date }
  ): Promise<number> {
    const { userId } = user;
    const createdAt: Prisma.DateTimeFilter = {};
    const where = { userId, createdAt };
    const { startedAt, endedAt } = await Joi.object({
      startedAt: Joi.date().optional(),
      endedAt: Joi.date().optional(),
    }).validateAsync(props);
    if (startedAt) where.createdAt.gte = startedAt;
    if (endedAt) where.createdAt.lte = endedAt;
    const _sum: Prisma.PointModelSumAggregateInputType = { point: true };
    const aggregate = await prisma.pointModel.aggregate({ where, _sum });
    const { point } = aggregate._sum;
    return point || 0;
  }
}
