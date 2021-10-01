import { WrapperResult, WrapperResultLazyProps } from '.';

export function $_$(
  opcode: number,
  statusCode: number,
  message?: string,
  reportable?: boolean
): (props?: WrapperResultLazyProps) => WrapperResult {
  return (lazyOptions: WrapperResultLazyProps = {}) =>
    new WrapperResult({
      opcode,
      statusCode,
      message,
      reportable,
      ...lazyOptions,
    });
}

export const RESULT = {
  SUCCESS: $_$(0, 200),
  REQUIRED_ACCESS_KEY: $_$(101, 401, 'REQUIRED_ACCESS_KEY'),
  EXPIRED_ACCESS_KEY: $_$(102, 401, 'EXPIRED_ACCESS_KEY'),
  PERMISSION_DENIED: $_$(103, 403, 'PERMISSION_DENIED'),
  REQUIRED_LOGIN: $_$(104, 401, 'REQUIRED_LOGIN'),
  INVALID_ERROR: $_$(105, 500, 'INVALID_ERROR'),
  FAILED_VALIDATE: $_$(106, 400, 'FAILED_VALIDATE'),
  INVALID_API: $_$(107, 404, 'INVALID_API'),
  INVALID_LICENSE: $_$(108, 400, 'INVALID_LICENSE'),
  NOT_CONNECTED_WITH_METHOD: $_$(109, 404, 'NOT_CONNECTED_WITH_METHOD'),
  NOT_REGISTERED_USER: $_$(100, 404, 'NOT_REGISTERED_USER'),
  CANNOT_FIND_WITH_KAKAO: $_$(110, 404, 'CANNOT_FIND_WITH_KAKAO'),
  ALREADY_CONNECT_WITH_METHOD: $_$(111, 409, 'ALREADY_CONNECT_WITH_METHOD'),
  CANNOT_FIND_USER: $_$(112, 404, 'CANNOT_FIND_USER'),
  ALREADY_REGISTERED_USER: $_$(113, 409, 'ALREADY_REGISTERED_USER'),
  INVALID_PHONE_VALIDATE_CODE: $_$(114, 404, 'INVALID_PHONE_VALIDATE_CODE'),
  RETRY_PHONE_VALIDATE: $_$(115, 400, 'RETRY_PHONE_VALIDATE'),
  CANNOT_FIND_SESSION: $_$(116, 404, 'CANNOT_FIND_SESSION'),
  INVALID_MESSAGING_TOKEN: $_$(117, 400, 'INVALID_MESSAGING_TOKEN'),
  REQUIRED_LICENSE: $_$(118, 400, 'REQUIRED_LICENSE'),
};
