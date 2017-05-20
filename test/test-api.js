'use strict';

// Require the app after setting NODE_ENV
let app = require('../app.js');

// DB, Models and Schema
let mongoose = require("mongoose");
let Models = require(__base + 'models/User.js');
let User = Models.User;
let Vendor = Models.Vendor;

// Receipt stuff
let fs = require('fs');
let imageType = require('image-type');

// Log all db access to console
// mongoose.set('debug', true);

// JSON Schema
let Schema = require(__base + 'jsonschema/schema.js');

// Authentication
let jwt = require('jsonwebtoken');

// Dev-dependencies
let chai = require('chai');
let expect = require('chai').expect;

// Chai setup
chai.use(require('chai-http'));
chai.use(require('chai-json-schema'));

// Top-level test block
describe('API', () => {
    // Top-level cleanup before all tests
    before((done) => {
        process.env.NODE_ENV = "production";
        TestHelper.prepareDB(mongoose).then((err) => {
            done(err);
        });
    });

    // Top-level cleanup after all tests
    after((done) => {
        TestHelper.prepareDB(mongoose).then((err) => {
            done(err);
        });
    });

    describe('User Unrestricted', () => {
        describe('register', () => {
            before((done) => {
                TestHelper.prepareDB(mongoose).then((err) => {
                    done(err);
                });
            });

            it('should register a new user', (done) => {
                chai.request(app)
                    .post('/api/user/register')
                    .send(TestHelper.getTestUser())
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        done();
                    });
            });

            it('should not register a new user with illegal email', (done) => {
                let baduser = TestHelper.getTestUser();
                baduser.email = 'bademail.com';
                chai.request(app)
                    .post('/api/user/register')
                    .send(baduser)
                    .end((err, res) => {
                        expect(err).to.not.be.null;
                        expect(err).to.have.status(400);
                        done();
                    });
            });

            it('should not register a new user with existing email', (done) => {
                TestHelper.prepareDB(mongoose, true).then((user) => {
                    chai.request(app)
                        .post('/api/user/register')
                        .send(TestHelper.getTestUser())
                        .end((err, res) => {
                            expect(err).to.not.be.null;
                            expect(err).to.have.status(400);
                            done();
                        });
                });
            });
        });

        describe('authenticate', () => {
            before((done) => {
                TestHelper.prepareDB(mongoose, true).then(() => {
                    done();
                });
            });

            it('should authenticate a registered user', (done) => {
                let authform = {
                    email: TestHelper.getTestUser().email,
                    password: TestHelper.getTestUser().password,
                };

                chai.request(app)
                    .post('/api/user/authenticate')
                    .send(authform)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.have.property('token');
                        done();
                    });
            });

            it('should not authenticate a registered user against a bad password', (done) => {
                let authform = {
                    email: TestHelper.getTestUser().email,
                    password: "badpassword",
                };
                chai.request(app)
                    .post('/api/user/authenticate')
                    .send(authform)
                    .end((err, res) => {
                        expect(err).to.not.be.null;
                        expect(res).to.have.status(400);
                        done();
                    });
            });

            it('should not authenticate a nonexistent user', (done) => {
                let authform = {
                    email: "nonexistent@email.com",
                    password: "password",
                };
                chai.request(app)
                    .post('/api/user/authenticate')
                    .send(authform)
                    .end((err, res) => {
                        expect(err).to.not.be.null;
                        expect(res).to.have.status(404);
                        done();
                    });
            });
        });
    });

    describe('Vendor Unrestricted', () => {
        describe('register', () => {
            before((done) => {
                TestHelper.prepareDB(mongoose).then((err) => {
                    done(err);
                });
            });

            it('should register a new vendor', (done) => {
                chai.request(app)
                    .post('/api/vendor/register')
                    .send({
                        email: "vendor@vendor.com",
                        password: "vendorpass",
                        name: "Vendor Vendorson",
                        telephone: "111222333"
                    })
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        done();
                    });
            });

            it('should not register a new vendor with illegal email', (done) => {
                chai.request(app)
                    .post('/api/vendor/register')
                    .send(TestHelper.getTestVendor({
                        email: "badmail.com"
                    }))
                    .end((err, res) => {
                        expect(res).to.have.status(400);
                        done();
                    });
            });
        });

        describe('authenticate', () => {
            before((done) => {
                TestHelper.prepareDB(mongoose, true).then(() => {
                    done();
                });
            });

            it('should authenticate a registered vendor', (done) => {
                let regVendor = TestHelper.getTestVendor();
                chai.request(app)
                    .post('/api/vendor/authenticate')
                    .send({
                        email: regVendor.email,
                        password: regVendor.password
                    })
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        done();
                    });
            });

            it('should not authenticate a registered vendor against a bad password', (done) => {
                let testVendor = TestHelper.getTestVendor();
                chai.request(app)
                    .post('/api/vendor/authenticate')
                    .send({
                        email: testVendor.email,
                        password: "badpassword"
                    })
                    .end((err, res) => {
                        expect(err).to.not.be.null;
                        expect(res).to.have.status(400);
                        done();
                    });
            });

            it('should not authenticate a nonexistent vendor', (done) => {
                let authform = {
                    email: "nonexistent@email.com",
                    password: "password",
                };
                chai.request(app)
                    .post('/api/vendor/authenticate')
                    .send(authform)
                    .end((err, res) => {
                        expect(err).to.not.be.null;
                        expect(res).to.have.status(404);
                        done();
                    });
            });
        });
    });

    describe('User', () => {
        // Test user object for use in tests
        var testUser;

        // The API key
        var APIKey;

        before((done) => {
            TestHelper.prepareDB(mongoose, true).then((user) => {
                testUser = user[0];
                APIKey = TestHelper.getAPIKey(testUser);
                done();
            });
        });

        it('should not allow access without providing token', (done) => {
            chai.request(app)
                .get('/api/user')
                .end((err, res) => {
                    expect(err).to.not.be.null;
                    expect(res).to.have.status(401);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    done();
                });
        });

        it('should get the user document', (done) => {
            chai.request(app)
                .get('/api/user')
                .set('x-access-token', APIKey)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    expect(res.body.user).to.be.jsonSchema(Schema.Response.User);
                    expect(res.body.user.password).to.be.undefined;
                    done();
                });
        });

        describe('Cars', () => {
            beforeEach((done) => {
                TestHelper.prepareDB(mongoose, true).then((user) => {
                    testUser = user[0];
                    APIKey = TestHelper.getAPIKey(testUser);
                    done();
                });
            });

            it("should get own cars", (done) => {
                chai.request(app)
                    .get('/api/user/cars')
                    .set('x-access-token', APIKey)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        expect(res.body.cars).to.be.jsonSchema(Schema.Type.CarArray);
                        done();
                    });
            });

            it("should add new car", (done) => {
                chai.request(app)
                    .post('/api/user/cars')
                    .set('x-access-token', APIKey)
                    .send(TestHelper.getTestCar())
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        expect(res.body.car).to.be.jsonSchema(Schema.Type.Car);
                        done();
                    });
            });

            it("should update an existing car", (done) => {
                let randomCarId = testUser.cars[Math.floor(Math.random() * testUser.cars.length)].id;
                chai.request(app)
                    .patch('/api/user/cars/' + randomCarId)
                    .set('x-access-token', APIKey)
                    .send({
                        model: "Updated Model",
                        year: "1999"
                    })
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(201);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        expect(res.body.updatedCar).to.be.jsonSchema(Schema.Type.Car);
                        done();
                    });
            });

            it("should not update a nonexistent car", (done) => {
                chai.request(app)
                    .patch('/api/user/cars/' + '111111111111111111111111')
                    .set('x-access-token', APIKey)
                    .send({
                        model: "Updated Model",
                        year: "1999"
                    })
                    .end((err, res) => {
                        expect(err).to.not.be.null;
                        expect(res).to.have.status(404);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        done();
                    });
            });

            it("should remove a car", (done) => {
                let randomCarId = testUser.cars[Math.floor(Math.random() * testUser.cars.length)].id;
                chai.request(app)
                    .delete('/api/user/cars/' + randomCarId)
                    .set('x-access-token', APIKey)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(204);
                        done();
                    });
            });

            it("should not remove a nonexistent car", (done) => {
                chai.request(app)
                    .delete('/api/user/cars/' + '111111111111111111111111')
                    .set('x-access-token', APIKey)
                    .end((err, res) => {
                        expect(err).to.not.be.null;
                        expect(res).to.have.status(404);
                        done();
                    });
            });

            it("should get own car's service entries", (done) => {
                let randomCarId = testUser.cars[Math.floor(Math.random() * testUser.cars.length)].id;
                chai.request(app)
                    .get('/api/user/cars/' + randomCarId + '/services')
                    .set('x-access-token', APIKey)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        expect(res.body.serviceBook).to.be.jsonSchema(Schema.Type.ServiceArray);
                        done();
                    });
            });

            it("should not get nonexistent car's service entries", (done) => {
                chai.request(app)
                    .get('/api/user/cars/' + '111111111111111111111111' + '/services')
                    .set('x-access-token', APIKey)
                    .end((err, res) => {
                        expect(err).to.not.be.null;
                        expect(res).to.have.status(404);
                        expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                        done();
                    });
            });
        });
    });

    describe('Vendor', () => {
        // Test user object for use in tests
        let testUser;

        // Test vendor object for use in tests
        let testVendor;

        // The vendor API
        var APIKey;

        before((done) => {
            TestHelper.prepareDB(mongoose, true).then((user) => {
                testUser = user[0];
                testVendor = user[1];
                APIKey = TestHelper.getAPIKey(testVendor);
                done();
            });
        });

        it("should find a car via search", (done) => {
            let randomCar = testUser.cars[Math.floor(Math.random() * testUser.cars.length)];
            chai.request(app)
                .get('/api/vendor/cars/search/' + randomCar.SPZ)
                .set('x-access-token', APIKey)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    expect(res.body.car).to.be.jsonSchema(Schema.Type.Car);
                    expect(res.body.car.SPZ).to.equal(randomCar.SPZ);
                    done();
                });
        });

        it("should not find a nonexistent car via search", (done) => {
            chai.request(app)
                .get('/api/vendor/cars/search/' + "ZZZZZZZ")
                .set('x-access-token', APIKey)
                .end((err, res) => {
                    expect(err).to.not.be.null;
                    expect(res).to.have.status(404);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    done();
                });
        });

        it("should get all own services", (done) => {
            TestHelper.prepareDB(mongoose, true).then((user) => {
                let id = user[1].id;
                let image = fs.readFileSync('test/receipt.jpg');
                let test = new User(TestHelper.getTestUser({
                    cars: [TestHelper.getTestCar({
                        SPZ: "1M11234",
                        serviceBook: [TestHelper.getTestService({
                            vendorID: id,
                            receipt: {
                                data: new Buffer(image).toString('base64'),
                                contentType: imageType(image).mime
                            }
                        })]
                    })]
                }));

                test.save().then(() => {
                    chai.request(app)
                        .get('/api/vendor/services')
                        .set('x-access-token', APIKey)
                        .end((err, res) => {
                            expect(err).to.be.null;
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                            expect(res.body.services).to.be.jsonSchema(Schema.Type.ServiceArray);
                            done();
                        });
                });
            });
        });

        it("should add a new service entry", (done) => {
            let randomCarId = testUser.cars[Math.floor(Math.random() * testUser.cars.length)].id;
            let image = fs.readFileSync('test/receipt.jpg');
            chai.request(app)
                .post('/api/vendor/cars/' + randomCarId + '/services')
                .set('x-access-token', APIKey)
                .send(TestHelper.getTestService({
                    vendorID: testVendor.id,
                    receipt: {
                        data: new Buffer(image).toString('base64'),
                        contentType: imageType(image).mime
                    }
                }))
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(201);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    done();
                });
        });

        it("should not add a new service entry to a nonexistent car", (done) => {
            let image = fs.readFileSync('test/receipt.jpg');
            chai.request(app)
                .post('/api/vendor/cars/' + '111111111111111111111111' + '/services')
                .set('x-access-token', APIKey)
                .send(TestHelper.getTestService({
                    vendorID: testVendor.id,
                    receipt: {
                        data: new Buffer(image).toString('base64'),
                        contentType: imageType(image).mime
                    }
                }))
                .end((err, res) => {
                    expect(err).to.not.be.null;
                    expect(res).to.have.status(404);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    done();
                });
        });
    });

    describe('Production-specific tests', () => {
        beforeEach((done) => {
            process.env.NODE_ENV = 'production'; // Set to production
            TestHelper.prepareDB(mongoose).then((err) => {
                done(err);
            });
        });

        it('should throw a JsonSchemaValidation error on bad request', (done) => {
            chai.request(app)
                .post('/api/user/register')
                .send(TestHelper.getTestUser({
                    email: "somebadmail"
                }))
                .end((err, res) => {
                    expect(err).to.not.be.null;
                    expect(res).to.have.status(400);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    done();
                });
        });

        it('should throw a generic error on bad request', (done) => {
            chai.request(app)
                .delete('/api/user/cars/' + "somebadid")
                .end((err, res) => {
                    expect(err).to.not.be.null;
                    expect(res).to.have.status(err.status);
                    expect(res.body).to.be.jsonSchema(Schema.Response.Basic);
                    done();
                });
        });

        afterEach((done) => {
            process.env.NODE_ENV = 'test'; // Set back to test
            TestHelper.prepareDB(mongoose).then((err) => {
                done(err);
            });
        });
    });
});

/**
 * Contains common helper methods for tests
 *
 * @class TestHelper
 */
class TestHelper {
    /**
     * Returns a test user with optional custom parameters
     *
     * @static
     * @param {any} params
     * @returns
     *
     * @memberOf TestHelper
     */
    static getTestUser(params) {
        var user = {
            email: "test@test.com",
            password: "testpass",
            name: "Test Testingson",
            telephone: "420420420"
        };
        Object.assign(user, params);
        return user;
    }

    /**
     * Returns a test car with optional custom parameters
     *
     * @static
     * @param {any} params
     * @returns
     *
     * @memberOf TestHelper
     */
    static getTestCar(params) {
        var car = {
            model: 'Skoda Octavia',
            year: '2011',
            SPZ: '2M59989'
        };
        Object.assign(car, params);
        return car;
    }

    /**
     * Returns a test service with optional custom parameters
     *
     * @static
     * @param {any} params
     * @returns
     *
     * @memberOf TestHelper
     */
    static getTestService(params) {
        var service = {
            date: new Date(Date.now()),
            cost: '3200',
            description: 'Replaced brakes',
        };
        Object.assign(service, params);
        return service;
    }

    /**
     * Returns a test vendor with optional custom parameters
     *
     * @static
     * @param {any} params
     * @returns
     *
     * @memberOf TestHelper
     */
    static getTestVendor(params) {
        var vendor = {
            email: "vendor@vendor.com",
            password: "vendorpass",
            name: "Vendor Vendorson",
            telephone: "111222333",
            address: "11 Vendor Street, Vendor Avenue, New Vendor"
        };
        Object.assign(vendor, params);
        return vendor;
    }


    /**
     * Adds a test user to the DB
     *
     * @param {any} done Callback for Mocha to finish
     * @param {any} user The newly created User document
     * @memberOf TestHelper
     */
    static addTestUser() {
        return new Promise((resolve, reject) => {
            let image = fs.readFileSync('test/receipt.jpg');
            let testUser = new User(TestHelper.getTestUser({
                cars: [TestHelper.getTestCar({
                    serviceBook: [TestHelper.getTestService({
                        vendorID: "507f1f77bcf86cd799439011", // random ID
                        receipt: {
                            data: new Buffer(image).toString('base64'),
                            contentType: imageType(image).mime
                        }
                    })]
                })]
            }));

            testUser.save((err, user) => {
                if (err) {
                    reject(err);
                }
                resolve(user);
            });
        });
    }


    /**
     * Adds a test Vendor
     *
     * @static
     * @returns
     *
     * @memberOf TestHelper
     */
    static addTestVendor() {
        return new Promise((resolve, reject) => {
            let testVendor = new Vendor(TestHelper.getTestVendor());

            testVendor.save((err, vendor) => {
                if (err) {
                    return reject(err);
                } else {
                    resolve(vendor);
                }
            });
        });
    }

    /**
     * Signs a new Auth Token for the user specified
     *
     * @param {any} user
     * @returns Auth Token
     *
     * @memberOf TestHelper
     */
    static getAPIKey(user) {
        return jwt.sign({
            id: user.id
        }, app.get('superSecret'), {
                expiresIn: '24h'
            });
    }

    /**
     * Cleans the database and optionally adds a test user
     *
     * @static
     * @param {any} db
     * @param {any} done
     * @param {any} addTestUser
     *
     * @memberOf TestHelper
     */
    static prepareDB(db, addTestUserAndVendor) {
        return new Promise((resolve, reject) => {
            // Drop the whole database
            db.connection.dropDatabase()
                .then(() => {
                    if (addTestUserAndVendor) {
                        Promise.all([TestHelper.addTestUser(), TestHelper.addTestVendor()])
                            .then((values) => {
                                resolve(values);
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    } else {
                        resolve();
                    }
                })
                .catch((err) => {
                    resolve(err);
                });
        });
    }
}