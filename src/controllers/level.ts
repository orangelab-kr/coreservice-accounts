import { LevelModel, UserModel } from '@prisma/client';
import { Point, prisma, RESULT } from '..';

export class Level {
  public static async getLevel(user: UserModel): Promise<LevelModel> {
    const { levelNo } = user;
    const level = await prisma.levelModel.findFirst({ where: { levelNo } });
    if (!level) throw RESULT.INVALID_ERROR();
    return level;
  }

  public static async getLevels(): Promise<LevelModel[]> {
    return prisma.levelModel.findMany({});
  }

  public static async updateLevel(user: UserModel): Promise<UserModel> {
    const point = await Point.getCurrentMonthPoint(user);
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
