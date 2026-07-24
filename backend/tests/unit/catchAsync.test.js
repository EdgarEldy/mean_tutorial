const catchAsync = require('../../src/shared/utils/catchAsync');

describe('catchAsync', () => {
  it('calls the wrapped function with req, res, next', async () => {
    const fn  = jest.fn().mockResolvedValue('ok');
    const req = {}, res = {}, next = jest.fn();
    await catchAsync(fn)(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('forwards errors to next', async () => {
    const err  = new Error('boom');
    const fn   = jest.fn().mockRejectedValue(err);
    const next = jest.fn();
    await catchAsync(fn)({}, {}, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
