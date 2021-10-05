import { PassProgram, RESULT, Wrapper, WrapperCallback } from '../..';

export function InternalPassProgramMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { passProgramId } = req.params;
    if (!passProgramId) throw RESULT.CANNOT_FIND_PASS_GROUP();
    req.internal.passProgram = await PassProgram.getPassProgramOrThrow(
      passProgramId
    );

    next();
  });
}
