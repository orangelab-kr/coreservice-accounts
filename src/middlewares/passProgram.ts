import { PassProgram, RESULT, Wrapper, WrapperCallback } from '..';

export function PassProgramMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { passProgramId } = req.params;
    if (!passProgramId) throw RESULT.CANNOT_FIND_PASS_GROUP();
    req.passProgram = await PassProgram.getPassProgramOrThrow(passProgramId);
    next();
  });
}
