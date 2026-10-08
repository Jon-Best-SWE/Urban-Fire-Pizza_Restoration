export class DomainValidationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "DomainValidationError";
    this.code = code;
    this.details = details;
  }
}

