// middleware/error.middleware.js
// Catches any unhandled error thrown inside async route handlers.
// Must be registered LAST in app.js (after all routes).

const errorMiddleware = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ status: "error", message: "Validation failed", errors });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ status: "error", message: "Duplicate record", errors: err.keyValue });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ status: "error", message: "File too large. Max 5 MB allowed." });
  }

  // Generic fallback
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
