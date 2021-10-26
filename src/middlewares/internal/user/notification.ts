import { Notification, RESULT, Wrapper, WrapperCallback } from '../../..';

export function InternalUserNotificationMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      internal: { user },
      params: { notificationId },
    } = req;

    if (!user || !notificationId) throw RESULT.CANNOT_FIND_NOTIFICATION();
    req.internal.notification = await Notification.getNotificationOrThrow(
      user,
      notificationId
    );

    next();
  });
}
