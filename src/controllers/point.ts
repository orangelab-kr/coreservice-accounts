import { Prisma, PointModel, PointType, UserModel } from '@prisma/client';
import { Joi, prisma } from '..';

export class Point {
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
