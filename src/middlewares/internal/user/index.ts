import { WrapperCallback, RESULT, Session, User, Wrapper } from '../../..';

export * from './notification';
export * from './session';

export function InternalUserBySessionMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { sessionId } = req.body;
    if (typeof sessionId !== 'string') throw RESULT.REQUIRED_LOGIN();
    const user = await Session.getUserBySessionId(sessionId);
    req.internal.sessionId = sessionId;
    req.internal.user = user;

    next();
  });
}

export function InternalUserMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { userId } = req.params;
    if (!userId) throw RESULT.CANNOT_FIND_USER();
    const user = await User.getUserOrThrow(userId);
    req.internal.user = user;
    next();
  });
}
