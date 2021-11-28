import { PassModel, PassProgramModel, UserModel } from '@prisma/client';
import { $$$, logger, Notification, Pass } from '..';
import * as Sentry from '@sentry/node';
import dayjs from 'dayjs';

export const onPassExtendScheduler = async (): Promise<void> => {
  const transactions = [];
  const passes: (PassModel & {
    passProgram?: PassProgramModel;
    user?: UserModel;
  })[] = await $$$(Pass.getExtendablePass({}, true));

  for (const pass of passes) {
    if (!pass.passProgram || !pass.user) continue;
    const { user, passProgram, passId } = pass;
    const displayName = `${user.realname}(${user.userId})님의 ${passProgram.name}(${passId})`;
    const props: { autoRenew?: boolean; requestedAt?: Date } = {};

    try {
      props.requestedAt = new Date();
      const remainingDays = dayjs(pass.expiredAt).diff(dayjs(), 'd');
      if (!pass.autoRenew) {
        const shortMessage = remainingDays
          ? `${remainingDays}일 후 만료`
          : '오늘';

        const message = remainingDays
          ? `${remainingDays}일 후 만료될 예정입니다.`
          : `오늘 만료될 예정입니다.`;

        logger.info(`패스 연장 / ${displayName} 패스는 ${message}`);
        transactions.push(Pass.modifyPass(pass, props));
        await Notification.createNotification(user, {
          type: 'info',
          title: `🎫 ${passProgram.name} 패스 / ${shortMessage} 만료예정`,
          description: `패스는 ${message}`,
        });

        continue;
      }

      if (!pass.passProgram.isSale || !pass.passProgram.allowRenew) {
        logger.info(
          `패스 연장 / ${displayName} 패스는 판매가 중단되어 더이상 연장할 수 없습니다.`
        );

        props.autoRenew = false;
        transactions.push(Pass.modifyPass(pass, props));
        await Notification.createNotification(user, {
          type: 'info',
          title: `🎫 ${passProgram.name} 패스 / 자동연장 실패`,
          description: `해당 패스는 판매가 중단되어 더이상 연장할 수 없습니다.`,
        });

        continue;
      }

      const extendedPass = await $$$(Pass.extendPass(pass));
      const extendedDate = dayjs(extendedPass.expiredAt).format('MM월 DD일');
      transactions.push(Pass.modifyPass(pass, props));
      logger.info(
        `패스 연장 / ${displayName} 패스가 ${extendedDate}까지 연장되었습니다.`
      );

      await Notification.createNotification(user, {
        type: 'info',
        title: `🎫 ${passProgram.name} 패스 / 자동연장 성공`,
        description: `${extendedDate}까지 이용할 수 있도록 연장되었습니다.`,
      });
    } catch (err: any) {
      if (err.name === 'Result' && [221, 215].includes(err.details.opcode)) {
        logger.error(
          `패스 연장 / ${displayName} 패스를 자동으로 연장할 수 없습니다. ${err.details.message}`
        );

        props.autoRenew = false;
        transactions.push(Pass.modifyPass(pass, props));
        await Notification.createNotification(user, {
          type: 'info',
          title: `🎫 ${passProgram.name} 패스 / 자동연장 실패`,
          description: `자동으로 연장할 수 없습니다. ${err.details.message}`,
        });

        continue;
      }

      const eventId = Sentry.captureException(err);
      logger.error(
        `패스 연장 / ${displayName} 패스를 자동으로 연장할 수 없습니다. (${eventId})`
      );
    }
  }

  await $$$(transactions);
};
