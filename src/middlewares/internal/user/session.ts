import { Callback, InternalError, OPCODE, Session, Wrapper } from '../../..';

export function InternalUserSessionMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const {
      params: { sessionId },
      internal: { user },
    } = req;
    if (!user || !sessionId) {
      throw new InternalError('세션을 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    req.internal.session = await Session.getSessionOrThrow(user, sessionId);
    await next();
  });
}
