const errorMiddleware = require('../../src/middlewares/error.middleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorMiddleware', () => {
  const OLD_ENV = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = OLD_ENV;
  });

  it('uses err.statusCode when set', () => {
    const err = new Error('Not Found');
    err.statusCode = 404;
    const res = mockRes();
    errorMiddleware(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('defaults to 500 when err.statusCode is absent', () => {
    const res = mockRes();
    errorMiddleware(new Error('oops'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('exposes stack in development', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('dev error');
    const res = mockRes();
    errorMiddleware(err, {}, res, jest.fn());
    const payload = res.json.mock.calls[0][0];
    expect(payload.errors).toHaveProperty('stack');
  });

  it('hides stack in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('prod error');
    const res = mockRes();
    errorMiddleware(err, {}, res, jest.fn());
    const payload = res.json.mock.calls[0][0];
    expect(payload).not.toHaveProperty('errors');
  });
});
