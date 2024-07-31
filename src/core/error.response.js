const statusCode = require('./statusCode');
const reasonPhrases = require('./reasonPhrases');

class ErrorReponse extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

class ConflictError extends ErrorReponse {
  constructor(message = reasonPhrases.CONFLICT, status = statusCode.CONFLICT) {
    super(message, status);
  }
}

class BadRequestError extends ErrorReponse {
  constructor(message = reasonPhrases.BAD_REQUEST, status = statusCode.BAD_REQUEST) {
    super(message, status);
  }
}

class InternalServerError extends ErrorReponse {
  constructor(message = reasonPhrases.INTERNAL_SERVER_ERROR, status = statusCode.INTERNAL_SERVER_ERROR) {
    super(message, status);
  }
}

class ForbiddenError extends ErrorReponse {
  constructor(message = reasonPhrases.FORBIDDEN, status = statusCode.FORBIDDEN) {
    super(message, status);
  }
}

class UnauthorizedError extends ErrorReponse {
  constructor(message = reasonPhrases.UNAUTHORIZED, status = statusCode.UNAUTHORIZED) {
    super(message, status);
  }
}

// Thêm các lớp lỗi thông dụng khác

class NotFoundError extends ErrorReponse {
  constructor(message = reasonPhrases.NOT_FOUND, status = statusCode.NOT_FOUND) {
    super(message, status);
  }
}

class MethodNotAllowedError extends ErrorReponse {
  constructor(message = reasonPhrases.METHOD_NOT_ALLOWED, status = statusCode.METHOD_NOT_ALLOWED) {
    super(message, status);
  }
}

class UnprocessableEntityError extends ErrorReponse {
  constructor(message = reasonPhrases.UNPROCESSABLE_ENTITY, status = statusCode.UNPROCESSABLE_ENTITY) {
    super(message, status);
  }
}

class NotImplementedError extends ErrorReponse {
  constructor(message = reasonPhrases.NOT_IMPLEMENTED, status = statusCode.NOT_IMPLEMENTED) {
    super(message, status);
  }
}

class ServiceUnavailableError extends ErrorReponse {
  constructor(message = reasonPhrases.SERVICE_UNAVAILABLE, status = statusCode.SERVICE_UNAVAILABLE) {
    super(message, status);
  }
}

class DeletedError extends ErrorReponse {
  constructor(message = 'Has been deleted', status = 810) {
    super(message, status);
  }
}

module.exports = {
  ConflictError,
  BadRequestError,
  InternalServerError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
  MethodNotAllowedError,
  UnprocessableEntityError,
  NotImplementedError,
  ServiceUnavailableError,
  DeletedError,
};
