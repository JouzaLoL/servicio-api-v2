'use strict';

let serializeError = require('serialize-error');
let routeHelper = require('../routes/routeHelper');
let chalk = require('chalk');
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
    switch (process.env.NODE_ENV) {
        case 'production':
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

                case 'UserNotFound':
                    res.status(404).json({
                        success: false,
                        statusText: err.message,
                        error: err.name,
                        code: 101
                    });
                    return;

                case 'BadPassword':
                    res.status(400).json({
                        success: false,
                        statusText: err.message,
                        error: err.name,
                        code: 102
                    });
                    return;

                default:
                    res.status(err.status ? err.status : 400).json(
                        routeHelper.BasicResponse(false, 'An error occured', {
                            error: {
                                status: err.status,
                                method: err.method,
                                path: err.path
                            }
                        }));
                    console.log(chalk.white.bgRed('Error:') + ' ' + chalk.red(JSON.stringify(serializeError(err))));
                    return;
            }

        default:
            if (err.name == 'JsonSchemaValidationError') {
                let formattedError = FormatValidationError(err.validationErrors);
                res.status(400).json(routeHelper.BasicResponse(false, 'Bad Request', {
                    error: formattedError
                }));
                console.log(chalk.white.bgRed('Validation Error:') + ' ' + chalk.red(JSON.stringify(formattedError)));
            } else {
                res.status(err.status || 500).json(serializeError(err));
                console.log(chalk.white.bgRed('Error:') + ' ' + chalk.red(JSON.stringify(serializeError(err))));
            }
            break;
    }
}

/**
 * Formats a ValidationError error
 *
 * @param {any} errors
 */
function FormatValidationError(errors) {
    var formatted = {};
    Object.keys(errors).forEach(function (requestProperty) {
        var propertyErrors = [];
        errors[requestProperty].forEach(function (error) {
            propertyErrors.push(error.dataPath + ": " + error.message);
        });
        formatted[requestProperty] = propertyErrors.toString();
    });
    return formatted;
}

module.exports = handleError;