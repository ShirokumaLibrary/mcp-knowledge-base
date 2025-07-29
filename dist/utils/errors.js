export class BaseError extends Error {
    timestamp;
    context;
    constructor(message, context) {
        super(message);
        this.name = this.constructor.name;
        this.timestamp = new Date().toISOString();
        this.context = context;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            context: this.context,
            stack: this.stack
        };
    }
}
export class ValidationError extends BaseError {
    code = 'VALIDATION_ERROR';
    statusCode = 400;
    fields;
    constructor(message, fields = {}, context) {
        super(message, context);
        this.fields = fields;
    }
}
export class AuthenticationError extends BaseError {
    code = 'AUTHENTICATION_ERROR';
    statusCode = 401;
}
export class AuthorizationError extends BaseError {
    code = 'AUTHORIZATION_ERROR';
    statusCode = 403;
}
export class NotFoundError extends BaseError {
    code = 'NOT_FOUND';
    statusCode = 404;
    resourceType;
    resourceId;
    constructor(resourceType, resourceId, context) {
        super(`${resourceType} with id ${resourceId} not found`, context);
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
}
export class ConflictError extends BaseError {
    code = 'CONFLICT';
    statusCode = 409;
}
export class InternalServerError extends BaseError {
    code = 'INTERNAL_SERVER_ERROR';
    statusCode = 500;
}
export class DatabaseError extends BaseError {
    code = 'DATABASE_ERROR';
    statusCode = 500;
    operation;
    constructor(operation, message, context) {
        super(message, context);
        this.operation = operation;
    }
}
export class FileSystemError extends BaseError {
    code = 'FILE_SYSTEM_ERROR';
    statusCode = 500;
    path;
    operation;
    constructor(operation, path, message, context) {
        super(message, context);
        this.operation = operation;
        this.path = path;
    }
}
export class ErrorUtils {
    static isErrorType(error, errorClass) {
        return error instanceof errorClass;
    }
    static wrap(error, defaultMessage = 'An unexpected error occurred') {
        if (error instanceof BaseError) {
            return error;
        }
        if (error instanceof Error) {
            if ('code' in error && typeof error.code === 'string') {
                if (['ENOENT', 'EACCES', 'EISDIR', 'ENOTDIR'].includes(error.code)) {
                    return new FileSystemError('unknown', 'unknown', error.message, { originalCode: error.code });
                }
            }
            return new InternalServerError(error.message, { originalError: error.name });
        }
        return new InternalServerError(defaultMessage, { error: String(error) });
    }
    static toLoggable(error) {
        if (error instanceof BaseError) {
            return error.toJSON();
        }
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }
        return {
            error: String(error),
            type: typeof error
        };
    }
}
