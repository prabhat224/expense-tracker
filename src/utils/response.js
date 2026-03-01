export const successResponse = (res, data, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const errorResponse = (res, message = "Error", statusCode = 500, error = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && error && { error: error.message }),
  });
