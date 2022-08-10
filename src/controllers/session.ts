import { Prisma, PrismaPromise, SessionModel, UserModel } from '@prisma/client';
import crypto from 'crypto';
import { $$$, Joi, prisma, RESULT } from '..';

export class Session {
  public static async getSessions(
    user: UserModel,
    props?: {
      take?: number;
      skip?: number;
      search?: string;
      orderByField?: 'usedAt' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
    }
  ): Promise<{ total: number; sessions: SessionModel[] }> {
    const { userId } = user;
    const where: Prisma.PassModelWhereInput = { userId };
    const { take, skip, search, orderByField, orderBySort } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().allow('').optional(),
      orderByField: Joi.string()
        .valid('usedAt', 'createdAt', 'updatedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
    }).validateAsync(props);

    if (search) where.userId = { contains: search };
    const orderBy = { [orderByField]: orderBySort };
    const [total, sessions] = await prisma.$transaction([
      prisma.sessionModel.count({ where }),
      prisma.sessionModel.findMany({ where, take, skip, orderBy }),
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
      throw RESULT.REQUIRED_LOGIN();
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
    if (!session) throw RESULT.CANNOT_FIND_SESSION();
    return session;
  }

  public static async setMessagingToken(
    sessionId: string,
    messagingToken: string
  ): Promise<void> {
    if (!messagingToken) throw RESULT.INVALID_MESSAGING_TOKEN();
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
