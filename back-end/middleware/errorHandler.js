const jwt = require("jsonwebtoken");
const AppError = require("../AppError");
const { logger } = require("../logger/logger");
const { TokenExpiredError } = jwt;

const catchError = (error, req, res, next) => {
  if (error instanceof TokenExpiredError) {
    return res.status(401).send({
      res: "failure",
      message: "Unauthorized! Access Token was expired!",
    });
  }
  if (error instanceof AppError) {
    if (error.actualErrorMessage)
      logger.error({
        level: "error",
        message: `${error.stack} \n Actual Error: ${error.actualErrorMessage}`,
      });
    else
      logger.error({
        level: "error",
        message: `${error.stack}`,
      });
    return res.status(error.statusCode).json(JSON.parse(error.message));
  }
  console.log(typeof error);
  logger.error({
    level: "error",
    message: error,
  });
  return res.status(500).send("Internal Server Error!");
};

module.exports = {
  catchError,
};
