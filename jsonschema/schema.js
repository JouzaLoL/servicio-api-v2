'use strict';

// The topmost schema object
const API = {};

// Contains type schemas
API.Type = {};

// Contains request schemas
API.Request = {};

// Service Entry schema
API.Type.Service = {
    type: 'object',
    required: ['date', 'cost', 'description', 'receipt', 'vendorID'],
    properties: {
        date: {
            type: 'string',
            format: 'date-time'
        },
        cost: {
            type: 'string',
            minLength: 1,
            maxLength: 30
        },
        description: {
            type: 'string',
            maxLength: 300
        },
        vendorID: {
            type: 'string'
        },
        vendorName: {
            type: 'string'
        },
        receipt: {
            type: 'object',
            required: ['data', 'contentType'],
            properties: {
                data: {},
                contentType: {
                    type: 'string'
                }
            }
        }
    }
};

API.Type.ServiceArray = {
    type: 'array',
    uniqueItems: true,
    items: API.Type.Service
};

// Car Schema
API.Type.Car = {
    type: 'object',
    required: ['model', 'year', 'SPZ'],
    properties: {
        model: {
            type: 'string',
            minLength: 5,
            maxLength: 30
        },
        SPZ: {
            type: 'string',
            minLength: 7,
            maxLength: 7
        },
        VIN: {
            type: 'string'
        },
        year: {
            type: 'string',
            minLength: 4,
            maxLength: 4
        },
        servicebook: {
            type: 'array',
            uniqueItems: true,
            items: API.Type.Service
        }
    }
};

// Car array schema
API.Type.CarArray = {
    type: 'array',
    uniqueItems: true,
    items: API.Type.Car
};

// User Schema
API.Type.User = {
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 30
        },
        password: {
            type: 'string',
            minLength: 5,
            maxLength: 60
        },
        name: {
            type: 'string',
            minLength: 5,
            maxLength: 30
        },
        telephone: {
            type: 'string',
            minLength: 9,
            maxLength: 13
        },
        cars: API.Type.CarArray
    }
};

API.Type.Vendor = {
    type: 'object',
    required: ['email', 'name', 'password'],
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 30
        },
        password: {
            type: 'string',
            minLength: 5,
            maxLength: 60
        },
        name: {
            type: 'string',
            minLength: 5,
            maxLength: 50
        },
        telephone: {
            type: 'string',
            minLength: 9,
            maxLength: 13
        },
        address: {
            type: 'string',
            minLength: 9,
            maxLength: 80
        }
    }
};

API.Request.Authenticate = {
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 30
        },
        password: {
            type: 'string',
            minLength: 5,
            maxLength: 60
        }
    }
};

API.Request.PatchCar = {
    type: 'object',
    additionalProperties: false,
    properties: {
        model: {
            type: 'string',
            minLength: 5,
            maxLength: 30
        },
        year: {
            type: 'string',
            minLength: 4,
            maxLength: 4
        },
        SPZ: {
            type: 'string',
            minLength: 7,
            maxLength: 7
        },
    }
};

API.Type.ID = {
    type: 'string',
    minLength: 24,
    maxLength: 24
};

API.Request.ID = {
    type: 'object',
    properties: {
        id: API.Type.ID
    }
};

module.exports = API;