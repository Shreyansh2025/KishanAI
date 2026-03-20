// utils/responseHandler.js
// Enforces a single response envelope across all endpoints:
// { status, message, data }

const success = (res, message, data = null, code = 200) =>
  res.status(code).json({ status: "success", message, data });

const error = (res, message, code = 500, errors = null) =>
  res.status(code).json({
    status: "error",
    message,
    ...(errors && { errors }),
  });

const validationError = (res, message, errors = null) =>
  error(res, message, 400, errors);

const notFound = (res, message = "Resource not found") =>
  error(res, message, 404);

module.exports = { success, error, validationError, notFound };
