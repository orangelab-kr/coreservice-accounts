import { Auth, Callback, InternalError, OPCODE, Session, Wrapper } from '../..';

export function InternalUserBySessionMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const { sessionId } = req.body;
    if (typeof sessionId !== 'string') {
      throw new InternalError(
        '로그인이 필요한 서비스입니다.',
        OPCODE.REQUIRED_LOGIN
      );
    }

    const user = await Session.getUserBySessionId(sessionId);
    req.internal.sessionId = sessionId;
    req.internal.user = user;

    await next();
  });
}

export function InternalUserMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const { userId } = req.params;
    if (!userId) {
      throw new InternalError(
        '로그인이 필요한 서비스입니다.',
        OPCODE.REQUIRED_LOGIN
      );
    }

    const user = await Auth.getUserOrThrow(userId);
    req.internal.user = user;

    await next();
  });
}
