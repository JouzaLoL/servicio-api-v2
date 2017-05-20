'use strict';

/**
 * Handles errors
 *
 * @param {any} err
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
function handleError(err, req, res, next) {
    switch (err.name) {
        case 'JsonSchemaValidationError':
            res.status(400).json({
                success: false,
                statusText: 'Bad Request',
                error: FormatValidationError(err.validationErrors)
            });
            return;
        case 'ValidationError':
            let error = {
                field: err.errors[Object.keys(err.errors)[0]].path,
                value: err.errors[Object.keys(err.errors)[0]].value,
                message: err.errors[Object.keys(err.errors)[0]].message
            };
            res.status(400).json({
                success: false,
                statusText: 'Validation Error',
                error: error,
                code: 103
            });
            return;

        default:
            return res.status(err.status ? err.status : 400).json(
                {
                    error: {
                        status: err.status,
                        method: err.method,
                        path: err.path
                    }
                });
    }
}
module.exports = handleError;