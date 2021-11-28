import { UserModel } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { Level, logger, Notification, User } from '..';

const processUser = async (user: UserModel): Promise<void> => {
  const { userId, realname } = user;

  try {
    const updatedUser = await Level.updateLevel(user);
    if (user.levelNo === updatedUser.levelNo) {
      logger.info(
        `레벨 업데이트 / ${realname}(${userId})님의 업데이트를 확인했습니다.`
      );

      return;
    }

    logger.info(
      `레벨 업데이트 / ${realname}(${userId})님의 레벨이 업데이트되었습니다. (${user.levelNo}Lv -> ${updatedUser.levelNo}Lv)`
    );

    await Notification.sendNotification(user, {
      type: 'info',
      title: `🌟 레벨이 변경되었습니다!`,
      description: `레벨이 업데이트되었습니다. 지금 바로 확인해보세요.`,
    });
  } catch (err: any) {
    const eventId = Sentry.captureException(err);
    logger.error(
      `레벨 업데이트 / ${realname}(${userId})님의 레벨을 업데이트할 수 없습니다. (${eventId})`
    );
  }
};

export const onLevelUpdateScheduler = async (): Promise<void> => {
  let total;
  let skip = 0;
  const take = 1;

  while (!total || total > skip) {
    const res = await User.getUsers({ take, skip });
    await Promise.all(res.users.map((user) => processUser(user)));
    total = res.total;
    skip += take;
  }
};
