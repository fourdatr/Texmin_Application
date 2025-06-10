class AppError extends Error {
  constructor(errorCode, message, statusCode, actualErrorMessage) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.actualErrorMessage = actualErrorMessage;
  }
}

module.exports = AppError;
