import { UserModel, LevelModel } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { Level, logger, Notification, Pass, User } from '..';

const processUser = async (oldUser: UserModel): Promise<void> => {
  const { userId, realname } = oldUser;

  try {
    const { user, level } = await Level.updateLevel(oldUser);
    const hasReward = await giveRewardCoupon({ user, level });
    if (hasReward) {
      await Notification.sendNotification(user, {
        type: 'info',
        title: `💝 ${level.name} 레벨 리워드 쿠폰이 도착했습니다!`,
        description: `쿠폰 메뉴에서 리워드 쿠폰을 확인하세요.`,
      });
    }

    if (user.levelNo === oldUser.levelNo) {
      logger.info(
        `레벨 업데이트 / ${realname}(${userId})님의 업데이트를 확인했습니다.`
      );

      return;
    }

    logger.info(
      `레벨 업데이트 / ${realname}(${userId})님의 레벨이 업데이트되었습니다. (${oldUser.levelNo}Lv -> ${user.levelNo}Lv)`
    );

    if (!hasReward) {
      await Notification.sendNotification(user, {
        type: 'info',
        title: `🌟 레벨이 변경되었습니다!`,
        description: `레벨이 업데이트되었습니다. 지금 바로 확인해보세요.`,
      });
    }
  } catch (err: any) {
    const eventId = Sentry.captureException(err);
    logger.error(
      `레벨 업데이트 / ${realname}(${userId})님의 레벨을 업데이트할 수 없습니다. (${eventId})`
    );
  }
};

export const giveRewardCoupon = async (props: {
  user: UserModel;
  level: LevelModel;
}): Promise<boolean> => {
  let hasReward = false;
  const { user, level } = props;
  const { userId, realname } = user;
  const { couponGroupId, couponAmount } = level;
  if (!couponGroupId || !couponAmount) return hasReward;
  for (let i = 0; i <= couponAmount - 1; i++) {
    try {
      hasReward = true;
      await Pass.generateCoupon(user, couponGroupId);
    } catch (err: any) {
      const eventId = Sentry.captureException(err);
      logger.error(
        `레벨 업데이트 / ${realname}(${userId})님에게 리워드 쿠폰을 제공할 수 없습니다. (${eventId})`
      );
    }
  }

  logger.info(
    `레벨 업데이트 / ${realname}(${userId})님에게 리워드 쿠폰을 제공하였습니다. (${couponAmount}개)`
  );

  return hasReward;
};

export const onLevelUpdateScheduler = async (): Promise<void> => {
  const take = 10;
  let total;
  let skip = 0;

  while (!total || total > skip) {
    const res = await User.getUsers({ take, skip });
    await Promise.all(res.users.map((user) => processUser(user)));
    total = res.total;
    skip += take;
  }
};
