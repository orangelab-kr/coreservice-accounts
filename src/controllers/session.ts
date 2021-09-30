import { Prisma, PrismaPromise, SessionModel, UserModel } from '@prisma/client';
import crypto from 'crypto';
import { $$$, InternalError, OPCODE, prisma } from '..';

export class Session {
  public static async getSessions(
    user: UserModel
  ): Promise<{ total: number; sessions: SessionModel[] }> {
    const { userId } = user;
    const [total, sessions] = await prisma.$transaction([
      prisma.sessionModel.count({ where: { userId } }),
      prisma.sessionModel.findMany({ where: { userId } }),
    ]);

    return { total, sessions };
  }

  public static async logoutSession(
    user: UserModel,
    session?: SessionModel
  ): Promise<() => PrismaPromise<Prisma.BatchPayload>> {
    const { userId } = user;
    const where: Prisma.SessionModelWhereInput = { userId };
    if (session) where.sessionId = session.sessionId;
    return () => prisma.sessionModel.deleteMany({ where });
  }

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

  public static async getSession(
    user: UserModel,
    sessionId: string
  ): Promise<() => Prisma.Prisma__SessionModelClient<SessionModel | null>> {
    const { userId } = user;
    return () =>
      prisma.sessionModel.findFirst({ where: { userId, sessionId } });
  }

  public static async getSessionOrThrow(
    user: UserModel,
    sessionId: string
  ): Promise<SessionModel> {
    const session = await $$$(Session.getSession(user, sessionId));
    if (!session) {
      throw new InternalError('세션을 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    return session;
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
