'use strict';
let app = require('../app');
let express = require('express');

// Modules
let jwt = require('jsonwebtoken');
let moment = require('moment');

// Models
let UserModels = require('../models/Models');
let User = UserModels.User;
let Car = UserModels.Car;
let Service = UserModels.Service;
let Vendor = UserModels.Vendor;

// Route Helper
let RouteHelper = require('./routeHelper.js');

// Validation
let Validator = require('express-json-validator-middleware').Validator;
let validator = new Validator({ allErrors: true });
let validate = validator.validate.bind(validator);
let Schema = require('../jsonschema/schema');

// Init routers
let UserAPIUnrestricted = express.Router();
let UserAPI = express.Router();
let VendorAPIUnrestricted = express.Router();
let VendorAPI = express.Router();
let AdminAPIUnrestricted = express.Router();
let AdminAPI = express.Router();

// Apply Authentication via JWT
UserAPI.use(RouteHelper.verifyToken);
VendorAPI.use(RouteHelper.verifyToken);
AdminAPI.use(RouteHelper.verifyToken);

// API Functions

let UserRegister = function (req, res, next) {
    let newUser = new User({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name
    });

    newUser
        .save()
        .then(() => {
            res.status(201);
        })
        .catch((error) => {
            next(error);
        });
};

let UserAuthenticate = function (req, res, next) {
    User
        .findOne({
            email: req.body.email
        })
        .then((user) => {
            if (!user) {
                next({ code: 101 });
            } else if (user) {
                user.comparePassword(req.body.password, (error, match) => {
                    if (error && !match) {
                        next({ code: 102 });
                    } else if (!error && match) {
                        let token = jwt.sign({
                            id: user.id
                        }, app.get('superSecret'), {
                                expiresIn: '7d'
                            });
                        res.json({ token: token });
                    }
                });
            }
        })
        .catch((error) => {
            next(error);
        });
};

let UserGetProfile = function (req, res, next) {
    getUser(req.userID)
        .then((user) => {
            res.json(RouteHelper.strip(user));
        })
        .catch((error) => {
            next(error);
        });
};

var GetCars = function (req, res, next) {
    Car
        .find({ owner: req.userID })
        .exec()
        .then((cars) => {
            res.json(cars);
        })
        .catch((error) => {
            next(error);
        });
};

let UserAddCar = function (req, res, next) {
    let newCar = new Car({
        owner: req.userID,
        SPZ: req.body.SPZ,
        VIN: req.body.VIN,
        model: req.body.model,
        year: req.body.year
    });

    newCar
        .save()
        .then(() => {
            res.status(201).end();
        })
        .catch((error) => {
            next(error);
        });
};

let VendorRegister = function (req, res, next) {
    let newVendor = new Vendor({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name
    });

    newVendor
        .save()
        .then(() => {
            res.status(201);
        })
        .catch((error) => {
            next(error);
        });
};

let VendorAuthenticate = function (req, res, next) {
    Vendor
        .findOne({
            email: req.body.email
        })
        .then((vendor) => {
            if (!vendor) {
                next({ code: 101 });
            } else if (vendor) {
                vendor.comparePassword(req.body.password, (error, match) => {
                    if (error && !match) {
                        next({ code: 102 });
                    } else if (!error && match) {
                        let token = jwt.sign({
                            id: vendor.id
                        }, app.get('superSecret'), {
                                expiresIn: '7d'
                            });
                        res.json({ token: token });
                    }
                });
            }
        })
        .catch((error) => {
            next(error);
        });
};

let VendorGetProfile = function (req, res, next) {
    getVendor(req.userID)
        .then((user) => {
            res.json(RouteHelper.strip(user));
        })
        .catch((error) => {
            next(error);
        });
};

let VendorGetAllServicedCars = function (req, res, next) {
    Car
        .find({
            services: {
                $elemmatch: {
                    vendorID: req.userID
                }
            }
        })
        .exec()
        .then((cars) => {
            res.json(cars);
        })
        .catch((error) => {
            next(error);
        });
};

let VendorAddServiceToCar = function (req, res, next) {
    var newService = new Service({
        vendorID: VendorID,
        mechanicName: req.body.mechanicName,
        date: req.body.date ? moment().format(req.body.date + "") : moment().format(),
        cost: req.body.cost,
        description: req.body.description
    });

    Car
        .findOne({
            _id: req.params.id
        })
        .exec()
        .then((car) => {
            if (!car) {
                res.status(404).json({ code: 201 });
            } else {
                car.services.push(newService);
                car.markModified('services');
                car
                    .save()
                    .then((savedCar) => {
                        res.status(201);
                    })
                    .catch((error) => {
                        next(error);
                    });
            }
        });
};

/**
 * Gets User from DB by ID
 *
 * @param {any} id
 * @returns
 */
function getUser(id) {
    return new Promise((resolve, reject) => {
        User
            .findOne({
                _id: id
            })
            .exec()
            .then((user) => {
                if (user) {
                    resolve(user);
                } else {
                    reject('No user found');
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}

/**
 * Gets Vendor from DB by ID
 *
 * @param {any} id
 * @returns
 */
function getVendor(id) {
    return new Promise((resolve, reject) => {
        Vendor
            .findOne({
                _id: id
            })
            .exec()
            .then((vendor) => {
                if (vendor) {
                    resolve(vendor);
                } else {
                    reject('No vendor found');
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}

// User API Routes

UserAPIUnrestricted.post('/register', validate({
    body: Schema.Type.User
}), UserRegister);

UserAPIUnrestricted.post('/authenticate', validate({
    body: Schema.Request.Authenticate
}), UserAuthenticate);


UserAPI.get('/', UserGetProfile);
UserAPI.get('/cars', GetCars);
UserAPI.post('/cars', validate({
    body: Schema.Request.NewCar
}), UserAddCar);

// Vendor API Routes

VendorAPIUnrestricted.post('/register', validate({
    body: Schema.Type.Vendor
}), VendorRegister);

VendorAPIUnrestricted.post('/authenticate', validate({
    body: Schema.Request.Authenticate
}), VendorAuthenticate);


VendorAPI.get('/', VendorGetProfile);
VendorAPI.get('/services', VendorGetAllServicedCars);
VendorAPI.post('/cars/:id/services', validate({
    body: Schema.Type.Service,
    params: Schema.Request.ID
}), VendorAddServiceToCar);

let API = express.Router();
API.use('/user/', [UserAPIUnrestricted, UserAPI]);
API.use('/vendor/', [VendorAPIUnrestricted, VendorAPI]);
API.use('/admin/', [AdminAPIUnrestricted, AdminAPI]);

module.exports = {
    API
};