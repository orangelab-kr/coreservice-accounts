import { WrapperCallback, RESULT, Session, Wrapper } from '..';

export function UserMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) throw RESULT.REQUIRED_LOGIN();
    const sessionId = authorization.substr(7);
    const user = await Session.getUserBySessionId(sessionId);
    req.sessionId = sessionId;
    req.user = user;

    next();
  });
}
