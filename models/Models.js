'use strict';

const bcrypt = require('bcrypt-nodejs');
const mongoose = require('mongoose');
let beautifyUnique = require('mongoose-beautiful-unique-validation');

const serviceSchema = new mongoose.Schema({
    date: Date,
    cost: String,
    description: String,
    vendorID: String,
    mechanicName: String
}, {
        timestamps: true
    });

const carSchema = new mongoose.Schema({
    owner: String,
    SPZ: {
        type: String,
        required: true,
        unique: true
    },
    VIN: {
        type: String,
        unique: true
    },
    model: String,
    year: String,
    services: [serviceSchema]
}, {
        timestamps: true
    });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: String,
    telephone: String,
    cars: [String]
});

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, null, (hashErr, hash) => {
            if (hashErr) {
                return next(hashErr);
            }
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = comparePassword;

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    address: String
}, {
        timestamps: true
    });

vendorSchema.pre('save', function save(next) {
    const vendor = this;
    if (!vendor.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(vendor.password, salt, null, (hashErr, hash) => {
            if (hashErr) {
                return next(hashErr);
            }
            vendor.password = hash;
            next();
        });
    });
});


vendorSchema.methods.comparePassword = comparePassword;


/**
 * Compares two passwords via bcrypt
 *
 * @param {any} candidatePassword
 * @param {any} callback
 */
function comparePassword(candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        callback(err, isMatch);
    });
};

// Apply plugin
userSchema.plugin(beautifyUnique);
carSchema.plugin(beautifyUnique);
vendorSchema.plugin(beautifyUnique);

// ! mongoose.mode('Collection_name_in_singular', schema to use);
const Service = mongoose.model('Service', serviceSchema);
const Car = mongoose.model('Car', carSchema);
const User = mongoose.model('User', userSchema);
const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = {
    Vendor,
    User,
    Car,
    Service
};