import { LevelModel, UserModel } from '@prisma/client';
import dayjs from 'dayjs';
import { Point, prisma, RESULT } from '..';

export class Level {
  public static async getLevels(): Promise<LevelModel[]> {
    return prisma.levelModel.findMany({});
  }

  public static async updateLevel(user: UserModel): Promise<UserModel> {
    const { userId } = user;
    const lastMonth = dayjs().subtract(1, 'month');
    const startedAt = lastMonth.startOf('month').toDate();
    const endedAt = lastMonth.endOf('month').toDate();
    const point = await Point.getTotalPoint(user, { startedAt, endedAt });
    const { levelNo } = await Level.getLevelByPoint(point);
    if (user.levelNo === levelNo) return user;
    return prisma.userModel.update({ where: { userId }, data: { levelNo } });
  }

  public static async getLevelByPoint(point: number): Promise<LevelModel> {
    const level = await prisma.levelModel.findFirst({
      where: { requiredPoint: { lte: point } },
      orderBy: { requiredPoint: 'desc' },
    });

    if (!level) throw RESULT.INVALID_ERROR();
    return level;
  }
}
