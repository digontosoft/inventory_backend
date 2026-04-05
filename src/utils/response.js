const success = (res, data, statusCode = 200, message = null) => {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined && data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

const paginated = (res, data, pagination) => {
  return res.status(200).json({ success: true, data, pagination });
};

const error = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, error: message });
};

module.exports = { success, paginated, error };
