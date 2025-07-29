export function successResponse(data, message) {
    return {
        success: true,
        data,
        message
    };
}
export function errorResponse(error, code) {
    return {
        success: false,
        error,
        code
    };
}
