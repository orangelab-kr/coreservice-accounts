import { Callback, InternalError, OPCODE, Session, Wrapper } from '..';

export function UserMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      throw new InternalError(
        '로그인이 필요한 서비스입니다.',
        OPCODE.REQUIRED_LOGIN
      );
    }

    const sessionId = authorization.substr(7);
    const user = await Session.getUserBySessionId(sessionId);
    req.sessionId = sessionId;
    req.user = user;

    await next();
  });
}
