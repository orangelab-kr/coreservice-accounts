import { UserModel } from '@prisma/client';
import crypto from 'crypto';
import Joi from 'joi';
import { Notification, prisma, RESULT } from '..';

export class Referral {
  public static async referralUser(
    user: UserModel,
    props: { referralCode: string }
  ): Promise<UserModel | null> {
    const { userId } = user;
    const { referralCode } = await Joi.object({
      referralCode: Joi.string().length(6).required(),
    }).validateAsync(props);
    if (user.referrerUserId) throw RESULT.ALREADY_SELECTED_REFERRER();
    const referrerUser = await Referral.getReferredUserOrThrow(referralCode);
    if (userId === referrerUser.userId) throw RESULT.CANNOT_REFERRAL_MYSELF();
    const referrerUserId = referrerUser.userId;

    // todo: 쿠폰을 주는 코드가 포함되어 있어야함

    await Notification.sendNotification(referrerUser, {
      type: 'info',
      title: `🥳 익명의 누군가가 추천인을 등록했습니다.`,
      description: `추천인 쿠폰이 지급되었습니다.`,
    });

    return prisma.userModel.update({
      where: { userId },
      data: { referrerUserId },
    });
  }

  public static async getReferredUserCount(user: UserModel): Promise<number> {
    const referrerUserId = user.userId;
    return prisma.userModel.count({ where: { referrerUserId } });
  }

  public static async getReferredUserOrThrow(
    referralCode: string
  ): Promise<UserModel> {
    const user = await Referral.getReferredUser(referralCode);
    if (!user) throw RESULT.INVALID_REFERRAL_CODE();
    return user;
  }

  public static async getReferredUser(
    referralCode: string
  ): Promise<UserModel | null> {
    return prisma.userModel.findFirst({ where: { referralCode } });
  }

  public static async generateReferralCode(): Promise<string> {
    let referralCode;
    while (true) {
      referralCode = crypto.randomBytes(3).toString('hex');
      const user = await prisma.userModel.findFirst({
        where: { referralCode },
      });

      if (!user) break;
    }

    return referralCode;
  }
}
