import { UserModel } from '@prisma/client';
import { Joi, logger, Notification, prisma } from '..';
import { reportMonitoringMetrics } from '../tools/monitoring';

export class Centercoin {
  public static async setBalance(
    user: UserModel,
    props: { centercoinBalance: number; message?: string }
  ): Promise<UserModel> {
    const { userId, realname } = user;
    const { centercoinBalance, message } = await Joi.object({
      centercoinBalance: Joi.number().integer().min(0).required(),
      message: Joi.string().allow(null).default('설명 없음').optional(),
    }).validateAsync(props);

    logger.info(
      `센터코인 / ${realname}(${userId})님에게 ${centercoinBalance.toLocaleString()}원으로 지정합니다. (${message})`
    );

    await reportMonitoringMetrics('centercoinSet', {
      user,
      centercoinBalance,
      message,
    });

    return prisma.userModel.update({
      where: { userId },
      data: { centercoinBalance },
    });
  }

  public static async increaseBalance(
    user: UserModel,
    props: { centercoinBalance: number; message?: string }
  ): Promise<UserModel> {
    const { userId, realname } = user;
    const { centercoinBalance, message } = await Joi.object({
      centercoinBalance: Joi.number().integer().min(0).required(),
      message: Joi.string().allow(null).default('설명 없음').optional(),
    }).validateAsync(props);

    logger.info(
      `센터코인 / ${realname}(${userId})님에게 ${centercoinBalance.toLocaleString()}원을 지급합니다. (${message})`
    );

    await reportMonitoringMetrics('centercoinIncrease', {
      user,
      centercoinBalance,
      message,
    });

    await Notification.sendNotification(user, {
      type: 'info',
      title: `💸 ${centercoinBalance.toLocaleString()}원 캐시백 적립`,
      description: `센터코인 리워드가 적립되었습니다.`,
    });

    return prisma.userModel.update({
      where: { userId },
      data: { centercoinBalance: { increment: centercoinBalance } },
    });
  }

  public static async decreaseBalance(
    user: UserModel,
    props: { centercoinBalance: number; message?: string }
  ): Promise<UserModel> {
    const { userId, realname } = user;
    const { centercoinBalance, message } = await Joi.object({
      centercoinBalance: Joi.number().integer().min(0).required(),
      message: Joi.string().allow(null).default('설명 없음').optional(),
    }).validateAsync(props);

    logger.info(
      `센터코인 / ${realname}(${userId})님에게 ${centercoinBalance.toLocaleString()}원을 차감합니다. (${message})`
    );

    await reportMonitoringMetrics('centercoinDecrease', {
      user,
      centercoinBalance,
      message,
    });

    return prisma.userModel.update({
      where: { userId },
      data: { centercoinBalance: { decrement: centercoinBalance } },
    });
  }
}
