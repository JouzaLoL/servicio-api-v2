let imageType = require('image-type');

// Database Stuff
let UserModels = require(__base + 'models/User');
let User = UserModels.User;
let Car = UserModels.Car;
let Service = UserModels.Service;
let Vendor = UserModels.Vendor;

// Route Helper
let RouteHelper = require(__base + 'routes/routeHelper');

// Validation
var Validator = require('express-json-validator-middleware').Validator;
var validator = new Validator({ allErrors: true });
var validate = validator.validate.bind(validator);
let Schema = require(__base + 'jsonschema/schema.js');

// Init vars
var UserAPIUnrestricted = express.Router();
var VendorAPIUnrestricted = express.Router();
var UserAPI = express.Router();
var VendorAPI = express.Router();
var AdminAPI = express.Router();
var AdminAPIUnrestricted = express.Router();

// JWT Verification middleware
UserAPI.use(RouteHelper.verifyToken);
VendorAPI.use(RouteHelper.verifyToken);
AdminAPI.use(RouteHelper.verifyToken);

/*
BEGIN UNRESTRICTED USER API
*/

UserAPIUnrestricted.post('/register', validate({
  body: Schema.Type.User
}), function (req, res, next) {
  var newUser = new User({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    telephone: req.body.telephone
  });

  // Save the new User to DB
  newUser
    .save()
    .then(() => {
      res.status(201).json(RouteHelper.BasicResponse(true, 'User register successful', {
        user: RouteHelper.strip(newUser)
      }));
    })
    .catch((error) => {
      next(error);
    });
});

UserAPIUnrestricted.post('/authenticate', validate({
  body: Schema.Request.Authenticate
}), function (req, res, next) {
  // Retrieve user from DB
  User
    .findOne({
      email: req.body.email
    })
    .then((user) => {
      // No user found
      if (!user) {
        next(Object.assign(Error('User not found in database'), { name: 'UserNotFound', code: 101 }));
      } else if (user) {
        // User found
        // Verify password
        user.comparePassword(req.body.password, (error, isMatch) => {
          if (!isMatch) {
            next(Object.assign(Error("Passwords don't match"), { name: 'BadPassword', code: 102 }));
          } else if (isMatch) {
            // Passsword OK
            // Create a token
            let token = jwt.sign({
              id: user.id
            }, app.get('superSecret'), {
                expiresIn: '7d'
              });

            // return the information including the token as JSON
            res.json(RouteHelper.BasicResponse(true, 'Authentication success. Token generated', {
              token: token
            }));
          }
        });
      }
    })
    .catch((error) => {
      next(error);
    });
});

/*
END UNRESTRICTED USER API
*/

/*
BEGIN UNRESTRICTED VENDOR API
*/

VendorAPIUnrestricted.post('/register', validate({
  body: Schema.Type.Vendor
}), function (req, res, next) {
  var newVendor = new Vendor({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  // Save the new User to DB
  newVendor
    .save()
    .then(() => {
      res.status(201).json(RouteHelper.BasicResponse(true, 'Vendor register successful', {
        user: newVendor
      }));
    })
    .catch((error) => {
      next(error);
    });
});

VendorAPIUnrestricted.post('/authenticate', validate({
  body: Schema.Request.Authenticate
}), function (req, res, next) {
  // Retrieve user from DB
  Vendor
    .findOne({
      email: req.body.email
    })
    .then((vendor) => {
      // No vendor found
      if (!vendor) {
        next(Object.assign(Error('User not found in database'), { name: 'UserNotFound', code: 101 }));
      } else if (vendor) {
        // vendor found
        // Verify password
        vendor.comparePassword(req.body.password, (error, isMatch) => {
          if (!isMatch) {
            next(Object.assign(Error("Passwords don't match"), { name: 'BadPassword', code: 102 }));
          } else if (isMatch) {
            // Passsword OK
            // Create a token
            let token = jwt.sign({
              id: vendor.id
            }, app.get('superSecret'), {
                expiresIn: '7d'
              });

            // return the information including the token as JSON
            res.json(RouteHelper.BasicResponse(true, 'Authentication success. Token generated', {
              token: token
            }));
          }
        });
      }
    })
    .catch((error) => {
      next(error);
    });
});

/*
END UNRESTRICTED VENDOR API
*/

/*
BEGIN RESTRICTED USER API
*/

// Get User Document
UserAPI.get('/', (req, res, next) => {
  var userID = req.decodedToken.id;

  getUser(userID)
    .then((user) => {
      res.json(RouteHelper.BasicResponse(true, 'User found', {
        user: RouteHelper.strip(user)
      }));
    })
    .catch((error) => {
      next(error);
    });
});

// Get Cars
UserAPI.get('/cars', (req, res, next) => {
  var userID = req.decodedToken.id;
  getUser(userID)
    .then((user) => {
      res.json(RouteHelper.BasicResponse(true, '', {
        cars: RouteHelper.strip(user.cars, ['_id'])
      }));
    })
    .catch((error) => {
      next(error);
    });
});

// Add new Car
UserAPI.post('/cars', validate({
  body: Schema.Request.NewCar
}), (req, res, next) => {
  var userID = req.decodedToken.id;

  var newCar = new Car({
    model: req.body.model,
    year: req.body.year,
    SPZ: req.body.SPZ,
    VIN: req.body.VIN
  });

  getUser(userID)
    .then((user) => {
      user.cars.push(newCar);
      user.markModified('cars');
      user.save((savedUser) => {
        res.status(201).json(RouteHelper.BasicResponse(true, 'Car added', {
          car: RouteHelper.strip(user.cars.id(newCar._id), ['_id'])
        }));
      });
    })
    .catch((error) => {
      next(error);
    });
});

// Update an existing Car
UserAPI.patch('/cars/:id/', validate({
  body: Schema.Request.PatchCar
}), (req, res, next) => {
  var userID = req.decodedToken.id;

  getUser(userID)
    .then((user) => {
      let carToBeUpdated = user.cars.id(req.params.id);
      if (!carToBeUpdated) {
        return res.status(404).json(RouteHelper.BasicResponse(false, 'No Car matches the ID', { code: 201 }));
      }

      Object.keys(req.body).forEach(function (key) {
        carToBeUpdated[key] = req.body[key];
      });

      user
        .save()
        .then((savedUser) => {
          res.status(201).json(RouteHelper.BasicResponse(true, 'Car updated', {
            updatedCar: RouteHelper.strip(savedUser.cars.id(carToBeUpdated.id), ['_id'])
          }));
        })
        .catch((error) => {
          next(error);
        });
    })
    .catch((error) => {
      next(error);
    });
});

// Remove Car
UserAPI.delete('/cars/:id/', validate({
  params: Schema.Request.Params.ID
}), (req, res, next) => {
  var userID = req.decodedToken.id;

  getUser(userID)
    .then((user) => {
      let car = user.cars.id(req.params.id);
      if (car) {
        car
          .remove()
          .then((removedCar) => {
            user
              .save()
              .then(() => {
                // ! Always either send data or end response with end()
                res.status(204).end();
              })
              .catch((error) => {
                next(error);
              });
          })
          .catch((err) => {
            next(err);
          });
      } else {
        res.status(404).json(RouteHelper.BasicResponse(false, 'No Car matches the ID', { code: 201 }));
      }
    })
    .catch((error) => {
      next(error);
    });
});

// Get Car's Service entries
UserAPI.get('/cars/:id/services', (req, res, next) => {
  var userID = req.decodedToken.id;
  getUser(userID).then((user) => {
    let car = user.cars.id(req.params.id);
    if (!car) {
      return res.status(404).json(RouteHelper.BasicResponse(false, 'Car not found', { code: 201 }));
    } else {
      Vendor.find({}).exec().then((vendors) => {
        var __services = [];
        car.serviceBook.forEach(function (service) {
          var s = {};
          Object.assign(s, service._doc);
          s.vendor = vendors.find((vendor) => {
            return vendor.id == service.vendorID;
          }).name;
          __services.push(s);
        });

        return res.json(RouteHelper.BasicResponse(true, 'Services', {
          serviceBook: __services
        }));
      });
    }
  }).catch((error) => {
    next(error);
  });
});

/*
END RESTRICTED USER API
*/

/*
BEGIN RESTRICTED VENDOR API
*/

// Get own profile
VendorAPI.get('/', (req, res, next) => {
  var vendorID = req.decodedToken.id;

  getVendor(vendorID).then((vendor) => {
    res.json(RouteHelper.BasicResponse(true, 'Vendor found', {
      vendor: RouteHelper.strip(vendor, ['_id'])
    }));
  }).catch((error) => {
    next(error);
  });
});

// Get all Services of this Vendor
VendorAPI.get('/services', (req, res, next) => {
  var vendorID = req.decodedToken.id;
  var services = [];
  User.find({}).exec().then((users) => {
    users.forEach(function (user) {
      user.cars.forEach(function (car) {
        var c = car;
        car.serviceBook.forEach(function (service) {
          if (service.vendorID == vendorID) {
            var s = {};
            Object.assign(s, service._doc);
            s.car = c;
            services.push(s);
          }
        });
      });
    });

    if (services) {
      Vendor.find({
        _id: vendorID
      }).exec().then((vendor) => {
        let __services = [];
        services.forEach(function (service) {
          var s = {};
          Object.assign(s, service);
          s.vendor = vendor[0].name;
          __services.push(s);
        });

        return res.json(RouteHelper.BasicResponse(true, 'Servicebook', {
          services: __services
        }));
      });
    } else {
      res.status(404).json(RouteHelper.BasicResponse(false, 'No services found', { code: 301 }));
    }
  });
});

VendorAPI.get('/cars/search/:query', validate({
  params: Schema.Request.Search,
}), (req, res, next) => {
  let query = req.params.query;

  User
    .findOne({
      cars: {
        $elemMatch: {
          SPZ: query
        }
      }
    })
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json(RouteHelper.BasicResponse(false, 'Car not found', { code: 201 }));
      } else {
        let car = user.cars.find((elem) => {
          return (elem.SPZ == query);
        });

        return res.json(RouteHelper.BasicResponse(true, 'Car found', {
          car: RouteHelper.strip(car, ['_id'])
        }));
      }
    });
});

VendorAPI.post('/cars/:id/services/', validate({
  body: Schema.Request.NewService,
  params: Schema.Request.Params.ID
}), (req, res, next) => {
  var VendorID = req.decodedToken.id;
  let image = new Buffer(req.body.receipt.data, 'base64');

  var newService = new Service({
    date: req.body.date ? moment().format(req.body.date + "") : moment().format(),
    cost: req.body.cost,
    description: req.body.description,
    vendorID: VendorID,
    mechanicName: req.body.mechanicName,
    receipt: {
      data: image,
      contentType: imageType(image).mime
    }
  });

  User
    .findOne({
      cars: {
        $elemMatch: {
          _id: req.params.id
        }
      }
    })
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json(RouteHelper.BasicResponse(false, 'Car not found', { code: 201 }));
      } else {
        let car = user.cars.id(req.params.id);
        car.serviceBook.push(newService);
        car.markModified('serviceBook');
        // Need to save embedded doc first, then parent doc !
        car
          .save()
          .then((savedCar) => {
            user.markModified('cars');
            user
              .save()
              .then(() => {
                res.status(201).json(RouteHelper.BasicResponse(true, 'Service added', {
                  service: RouteHelper.strip(user.cars.id(car.id).serviceBook.id(newService._id))
                }));
              }).catch((error) => {
                next(error);
              });
          }).catch((error) => {
            next(error);
          });
      }
    });
});

/*
END RESTRICTED VENDOR API
*/

/*
BEGIN ADMIN API
*/
AdminAPIUnrestricted.post('/authenticate', function (req, res, next) {
  // Retrieve user from DB
  User
    .findOne({
      email: 'admin@admin.com'
    })
    .then((user) => {
      // No user found
      if (!user) {
        next(Object.assign(Error('User not found in database'), { name: 'UserNotFound', code: 101 }));
      } else if (user) {
        // User found
        // Verify password
        user.comparePassword(req.body.password, (error, isMatch) => {
          if (!isMatch) {
            next(Object.assign(Error("Passwords don't match"), { name: 'BadPassword', code: 102 }));
          } else if (isMatch) {
            // Passsword OK
            // Create a token
            let token = jwt.sign({
              id: user.id
            }, app.get('superSecret'), {
                expiresIn: '1y'
              });

            // return the information including the token as JSON
            res.json(RouteHelper.BasicResponse(true, 'ADMIN: Authentication success. Token generated', {
              token: token
            }));
          }
        });
      }
    })
    .catch((error) => {
      next(error);
    });
});

AdminAPI.post('/user/register', validate({
  body: Schema.Type.User
}), function (req, res, next) {
  var newUser = new User({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    telephone: req.body.telephone
  });

  // Save the new User to DB
  newUser
    .save()
    .then(() => {
      res.status(201).json(RouteHelper.BasicResponse(true, 'ADMIN: User register successful', {
        user: RouteHelper.strip(newUser)
      }));
    })
    .catch((error) => {
      next(error);
    });
});

AdminAPI.post('/vendor/register', validate({
  body: Schema.Type.Vendor
}), function (req, res, next) {
  var newVendor = new Vendor({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
  });

  // Save the new User to DB
  newVendor
    .save()
    .then(() => {
      res.status(201).json(RouteHelper.BasicResponse(true, 'ADMIN: Vendor register successful', {
        vendor: RouteHelper.strip(newVendor)
      }));
    })
    .catch((error) => {
      next(error);
    });
});

AdminAPI.get('/', function (req, res, next) {
  return res.json({ name: 'admin@admin.com' });
});

AdminAPI.get('/user/', function (req, res, next) {
  User.find({}).exec().then((users) => {
    return res.json(RouteHelper.strip(users, ['_id', 'updatedAt', 'createdAt']));
  });
});

AdminAPI.get('/vendor/', function (req, res, next) {
  Vendor.find({}).exec().then((vendors) => {
    return res.json(RouteHelper.strip(vendors, ['_id', 'updatedAt', 'createdAt']));
  });
});


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

// Export all routes
module.exports = {
  UserAPIUnrestricted,
  VendorAPIUnrestricted,
  UserAPI,
  VendorAPI,
  AdminAPI,
  AdminAPIUnrestricted
};