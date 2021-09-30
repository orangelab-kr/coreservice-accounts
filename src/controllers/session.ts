import { UserModel } from '@prisma/client';
import crypto from 'crypto';
import { InternalError, OPCODE } from '..';
import { Database } from '../tools';

const { prisma } = Database;

export class Session {
  public static async createSession(
    user: UserModel,
    platform?: string
  ): Promise<string> {
    const { userId } = user;
    const sessionId = await Session.generateSessionId();
    await prisma.sessionModel.create({
      data: { sessionId, platform, user: { connect: { userId } } },
    });

    return sessionId;
  }

  public static async getUserBySessionId(
    sessionId: string
  ): Promise<UserModel> {
    try {
      const where = { sessionId };
      const data = { user: { update: { usedAt: new Date() } } };
      const user = await prisma.sessionModel.update({ where, data }).user();
      if (!user) throw Error();

      return user;
    } catch (err: any) {
      throw new InternalError(
        '로그아웃되었습니다 다시 로그인해주세요.',
        OPCODE.REQUIRED_LOGIN
      );
    }
  }

  public static async setMessagingToken(
    sessionId: string,
    messagingToken: string
  ): Promise<void> {
    if (!messagingToken) {
      throw new InternalError('올바른 메시징 토큰이 필요합니다.');
    }

    await prisma.sessionModel.update({
      where: { sessionId },
      data: { messagingToken },
    });
  }

  private static async generateSessionId(): Promise<string> {
    let sessionId;
    while (true) {
      sessionId = crypto.randomBytes(95).toString('base64');
      const session = await prisma.sessionModel.findFirst({
        where: { sessionId },
      });

      if (!session) break;
    }

    return sessionId;
  }
}
