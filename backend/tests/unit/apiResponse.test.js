const apiResponse = require('../../src/shared/utils/apiResponse');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('apiResponse.success', () => {
  it('returns 200 with success:true and message', () => {
    const res = mockRes();
    apiResponse.success(res, 'OK');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OK' });
  });

  it('includes data when provided', () => {
    const res = mockRes();
    apiResponse.success(res, 'OK', [1, 2, 3]);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OK', data: [1, 2, 3] });
  });

  it('omits data when null', () => {
    const res = mockRes();
    apiResponse.success(res, 'OK', null);
    const payload = res.json.mock.calls[0][0];
    expect(payload).not.toHaveProperty('data');
  });

  it('uses custom statusCode', () => {
    const res = mockRes();
    apiResponse.success(res, 'Created', { id: 1 }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('apiResponse.error', () => {
  it('returns 500 with success:false and message', () => {
    const res = mockRes();
    apiResponse.error(res, 'Server Error');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Server Error' });
  });

  it('includes errors when provided', () => {
    const res = mockRes();
    apiResponse.error(res, 'Bad Request', 400, { field: 'required' });
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad Request',
      errors:  { field: 'required' },
    });
  });

  it('omits errors when null', () => {
    const res = mockRes();
    apiResponse.error(res, 'Error', 500, null);
    const payload = res.json.mock.calls[0][0];
    expect(payload).not.toHaveProperty('errors');
  });
});
