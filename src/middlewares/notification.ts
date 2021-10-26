import { Notification, RESULT, Wrapper, WrapperCallback } from '..';

export function NotificationMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      user,
      params: { notificationId },
    } = req;

    if (!notificationId) throw RESULT.CANNOT_FIND_NOTIFICATION();
    req.notification = await Notification.getNotificationOrThrow(
      user,
      notificationId
    );

    next();
  });
}
