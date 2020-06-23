/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Endpoints for registering, logging in, and retrieving/modifying user information.
 */

const Users = require('../models/users.server.model');
const passwords = require('../helpers/bcrypt.helper');
const auth = require('../helpers/auth.helper');
const helper = require('../helpers/miscellaneous.helper.js');

/**
 * Register as a new user.
 */
exports.create = async function (req, res) {
    try {
        let data = {
            "name": req.body.name,
            "email": req.body.email,
            "password": req.body.password
        };

        // Check required fields are given
        for (var prop in data) {
            if (data[prop] == undefined) {
                res.statusMessage = `Bad Request: data should have required property '${prop}'`;
                return res.status(400).send();
            }
        }

        data.city = req.body.city;
        data.country = req.body.country;

        for (var prop in data) {
            if (Object.prototype.hasOwnProperty.call(data, prop) && data[prop] != undefined) {
                if (!helper.isValidString(data[prop])) {
                    res.statusMessage = `Bad Request: invalid entry for data.${prop}`;
                    return res.status(400).send();
                }
            }
        }

        // Validate email
        if (!helper.isValidEmail(data.email)) {
            res.statusMessage = "Bad Request: data.email should match format 'email'";
            return res.status(400).send();
        }

        // Hash password
        const hashPassword = await passwords.hash(data.password);
        const result = await Users.insert(data.name, data.email, hashPassword, data.city, data.country);
        res.status(201).send(result);
    } catch (err) {
        if (err.sqlState == '23000') {
            res.statusMessage = "Bad Request: email already in use";
            return res.status(400).send();
        } else {
            return res.status(500).send(`ERROR posting user: ${err}`);
        }
    }
};

/**
 * Login as an existing user.
 */
exports.login = async function (req, res) {
    try {
        let data = {
            "email": req.body.email,
            "password": req.body.password
        };

        // Check required fields are given
        for (var prop in data) {
            if (data[prop] == undefined) {
                res.statusMessage = `Bad Request: data should have required property '${prop}'`;
                return res.status(400).send();
            }
            if (!helper.isValidString(data[prop])) {
                res.statusMessage = `Bad Request: invalid entry for data.${prop}`;
                return res.status(400).send();
            }
        }

        // Check user details are valid
        const user = await Users.getUserByEmail(data.email);
        if (user === undefined) {
            res.statusMessage = "Bad Request: invalid email/password supplied";
            return res.status(400).send();
        }
        const validPassword = await passwords.compare(data.password, user.password);
        if (validPassword === false) {
            res.statusMessage = "Bad Request: invalid email/password supplied";
            return res.status(400).send();
        }

        // Generate token and store in DB
        // TODO: Fix this, should take in user data to make token unique
        const token = auth.generateToken();
        await Users.setToken(user.user_id, token);

        response = {
            "userId": user.user_id,
            "token": token
        };
        return res.status(200).send(response);
    } catch (err) {
        res.status(500).send(`ERROR logging in: ${err}`);
    }
};

/**
 * Log out the current authorized user.
 */
exports.logout = async function (req, res) {
    try {
        const clientToken = req.headers['x-authorization'];
        let user = null;

        if (clientToken != undefined) {
            if (!helper.isValidString(clientToken)) {
                return res.status(401).send();
            }
            user = await Users.userByToken(clientToken);
            if (user) {
                await Users.logout(clientToken);
                return res.status(200).send();
            }
        }
        return res.status(401).send();
    } catch (err) {
        res.status(500).send(`ERROR logging out: ${err}`);
    }
};

/**
 * Retrieve information about a user.
 * @param {integer} id - ID of the user
 */
exports.read = async function (req, res) {
    // TO DO: Check if user is logged in and viewing their own details
    try {
        const id = req.params.userId;
        const clientToken = req.headers['x-authorization'];
        const user = await Users.getUser(id);

        if (user == undefined) {
            return res.status(404).send();
        } else {
            let response = {
                "name": user.name,
                "city": user.city,
                "country": user.country
            };
            const token = await Users.getAuthToken(id);
            if (clientToken === token) {
                response.email = user.email;
            }
            return res.status(200).send(response);
        }
    } catch (err) {
        res.status(500).send(`ERROR fetching user: ${err}`);
    }
};

/**
 * Change a user's details.
 * @param {integer} id - ID of the user
 */
exports.update = async function (req, res) {
    try {
        const id = req.params.userId;
        const clientToken = req.headers['x-authorization'];
        const user = await Users.getUser(id);

        if (user == undefined) {
            return res.status(404).send();  // No user matches given ID
        }

        if (clientToken == undefined || !helper.isValidString(clientToken)) {
            return res.status(401).send();
        }

        if (clientToken != user.auth_token) {
            // Check if token belongs to another user
            if (await Users.userByToken(clientToken) != undefined) {
                return res.status(403).send();
            } else {
                return res.status(401).send();
            }
        }

        let data = {
            "name": req.body.name,
            "email": req.body.email,
            "password": req.body.password,
            "currentPassword": req.body.currentPassword,
            "city": req.body.city,
            "country": req.body.country
        };

        let isValidChange = false;
        for (var prop in data) {
            if (Object.prototype.hasOwnProperty.call(data, prop)) {
                if (!helper.isValidString(data[prop]) && data[prop] != undefined) {
                    res.statusMessage = `Bad Request: invalid value for data.${prop}`;
                    return res.status(400).send();
                } else if (helper.isValidString(data[prop])) {
                    isValidChange = true;
                }
            }
        }

        if (!isValidChange) {
            res.statusMessage = "Bad Request: you must provide some details to update";
            return res.status(400).send();
        }

        // Check user provides current password with password
        if (data.password && !data.currentPassword) {
            res.statusMessage = "Bad Request: please provide current password to change password";
            return res.status(400).send();
        }

        // If user is changing their password
        if (data.currentPassword) {
            // Check if current password is a match
            let validPassword = await passwords.compare(data.currentPassword, user.password);
            if (!validPassword) {
                res.statusMessage = "Bad Request: invalid password provided";
                return res.status(400).send();
            }
            if (data.password) {
                data.password = await passwords.hash(data.password);
            }
        }
        delete data.currentPassword;

        // If user has changed email
        if (user.email != data.email && (data.email != undefined)) {
            if (!helper.isValidEmail(data.email)) {
                res.statusMessage = "Bad Request: data.email should match format 'email'";
                return res.status(400).send();
            }
        }

        // Update all changed properties
        for (var prop in data) {
            if (Object.prototype.hasOwnProperty.call(data, prop)) {
                if (data[prop] != user[prop] && data[prop] != undefined) {
                    await Users.updateField(id, prop, data[prop]);
                }
            }
        }
        return res.status(200).send();
    } catch (err) {
        if (err.sqlState == '23000') {
            res.statusMessage = "Bad Request: email already in use";
            return res.status(400).send();
        } else {
            return res.status(500).send(`ERROR posting user: ${err}`);
        }
    }
};