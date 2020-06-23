/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Endpoints for retrieving, creating, modifying, and deleting petitions.
 */

const Petitions = require('../models/petitions.server.model');
const Categories = require('../models/categories.server.model');
const Users = require('../models/users.server.model');
const Signatures = require('../models/signatures.server.model');
const helper = require('../helpers/miscellaneous.helper.js');



/**
 * View petitions
 * @param {integer} startIndex - Number of items to skip before returning results
 * @param {integer} count - Number of items to include in results
 * @param {String} q - Only include petitions that have the search term within their title
 * @param {integer} categoryId - Only include petitions of this category (id)
 * @param {integer} authorId - Only include petitions that have the given user (id) as their author
 * @param {String} sortBy - Sort the petitions by the given property if present in validSorts
 */
exports.read = async function (req, res) {
    try {
        let data = {
            "startIndex": +req.query.startIndex,
            "count": +req.query.count,
            "categoryId": +req.query.categoryId,
            "authorId": +req.query.authorId
        };

        for (var prop in data) {
            if (Object.prototype.hasOwnProperty.call(data, prop)) {
                if (!isNaN(data[prop])) {
                    if (Number.isInteger(data[prop])) {
                        if (data[prop] < 0) {
                            res.statusMessage = `Bad Request: data.${prop} should be >= 0`;
                            return res.status(400).send();
                        }
                    } else {
                        res.statusMessage = `Bad Request: ${prop} should be integer`;
                        return res.status(400).send();
                    }
                }
            }
        }

        // Add and check string properties
        data.q = req.query.q;
        data.sortBy = req.query.sortBy;

        if (data.q != undefined) {
            if (!helper.isValidString(data.q)) {
                res.statusMessage = "Bad Request: data.q is invalid";
                return res.status(400).send();
            }
        }

        let validSorts = ['ALPHABETICAL_ASC', 'ALPHABETICAL_DESC', 'SIGNATURES_ASC', 'SIGNATURES_DESC'];
        if (data.sortBy != undefined) {
            if (validSorts.indexOf((data.sortBy).toUpperCase()) >= 0) {
                sortBy = data.sortBy;
            } else {
                res.statusMessage = "Bad Request: data.sortBy should be equal to one of the allowed values";
                return res.status(400).send();
            }
        }

        let opts = { "categoryId": data.categoryId, "authorId": data.authorId, "q": data.q };
        let petitions = await Petitions.getAll(opts);
        for (petition of petitions) {
            petition.authorName = (await Users.getUser(petition.author_id)).name;
            petition.category = (await Categories.getCategory(petition.category_id)).name;
            petition.signatureCount = await Signatures.getSignatureCount(petition.petition_id);
        }

        switch (data.sortBy) {
            case 'ALPHABETICAL_ASC':
                petitions.sort(helper.sortByProperties("title", "petition_id"));
                break;
            case 'ALPHABETICAL_DESC':
                petitions.sort(helper.sortByProperties("-title", "petition_id"));
                break;
            case 'SIGNATURES_ASC':
                petitions.sort(helper.sortByProperties("signatureCount", "petition_id"));
                break;
            default:
                petitions.sort(helper.sortByProperties("-signatureCount", "petition_id"));
        }

        if (data.startIndex) {
            petitions = petitions.slice(data.startIndex);
        }

        if (data.count) {
            petitions = petitions.slice(0, data.count);
        }

        results = []
        for (petition of petitions) {
            let response = {
                "petitionId": petition.petition_id,
                "title": petition.title,
                "category": petition.category,
                "authorName": petition.authorName,
                "signatureCount": petition.signatureCount
            }
            results.push(response);
        }
        return res.status(200).send(results);
    } catch (err) {
        return res.status(500).send(`ERROR getting petitions: ${err}}`);
    }
};

// Add a new petition
exports.create = async function (req, res) {
    try {
        const clientToken = req.headers['x-authorization'];
        if (clientToken == undefined || !helper.isValidString(clientToken)) {
            // No token
            return res.status(401).send();
        }

        const user = await Users.userByToken(clientToken);
        if (user == undefined || clientToken != user.auth_token) {
            // No token or no matching user
            return res.status(401).send();
        }

        let data = {
            "title": req.body.title,
            "description": req.body.description
        };

        // Check for required values
        for (var prop in data) {
            if (Object.prototype.hasOwnProperty.call(data, prop)) {
                if (data[prop] === undefined) {
                    res.statusMessage = `Bad Request: data should have required property '${prop}'`;
                    return res.status(400).send();
                }
                if (!helper.isValidString(data[prop])) {
                    res.statusMessage = `Bad Request: data.${prop} is invalid`;
                    return res.status(400).send();
                }
            }
        }

        data.closingDate = req.body.closingDate;
        let today = helper.currentDateTime();
        if (data.closingDate != null) {
            if (!helper.validateClosingDate(today, data.closingDate)) {
                res.statusMessage = "Bad Request: Closing date must be in the future";
                return res.status(400).send();
            }
        }

        data.categoryId = +req.body.categoryId;
        if (!isNaN(data.categoryId)) {
            if (Number.isInteger(data.categoryId)) {
                if (data.categoryId < 0) {
                    res.statusMessage = `Bad Request: data.categoryId should be >= 0`;
                    return res.status(400).send();
                }
            } else {
                res.statusMessage = `Bad Request: categoryId should be integer`;
                return res.status(400).send();
            }
            if (await Categories.getCategory(data.categoryId) == undefined) {
                res.statusMessage = "Bad Request: data.categoryId is invalid";
                return res.status(400).send();
            }
        } else {
            res.statusMessage = `Bad Request: data should have required property categoryId`;
            return res.status(400).send();
        }

        let result = await Petitions.insert(data.title, data.description, data.categoryId, today, data.closingDate, user.user_id);
        let response = { "petitionId": result };

        return res.status(201).send(response);
    } catch (err) {
        return res.status(500).send(`ERROR posting petition: ${err}}`);
    }
};

/**
 * Retrieve detailed information about a petition.
 * @param {integer} id - ID of the petition
 */
exports.readOne = async function (req, res) {
    try {
        const id = req.params.petitionId;
        let petition = await Petitions.getOne(id);
        if (!petition) {
            return res.status(404).send();
        }
        let user = await Users.getUser(petition.author_id);
        let category = await Categories.getCategory(petition.category_id);
        let signatureCount = await Signatures.getSignatureCount(petition.petition_id);

        let response = {
            "petitionId": petition.petition_id,
            "title": petition.title,
            "description": petition.description,
            "authorId": petition.author_id,
            "authorName": user.name,
            "authorCity": user.city,
            "authorCountry": user.country,
            "signatureCount": signatureCount,
            "category": category.name,
            "createdDate": petition.created_date,
            "closingDate": petition.closing_date
        }
        return res.status(200).send(response);
    } catch (err) {
        return res.status(500).send(`ERROR getting petition: ${err}}`);
    }
};


/**
 * Change a petition's details. Only accessible to the author of the petition. 
 * @param {integer} id - ID of the petition
 */
exports.update = async function (req, res) {
    try {
        const id = req.params.petitionId;
        const clientToken = req.headers['x-authorization'];
        const petition = await Petitions.getOne(id);

        if (petition == undefined) {
            return res.status(404).send();  // No petition matches given ID
        }
        if (clientToken == undefined || !helper.isValidString(clientToken)) {
            return res.status(401).send();
        }

        const user = await Users.userByToken(clientToken);
        if (user == undefined) {
            return res.status(401).send();
        }
        if (user.user_id != petition.author_id) {
            return res.status(403).send();  // Token belongs to another user
        }

        // Check petition has not closed
        if (petition.closing_date != null) {
            if (!helper.validateClosingDate(helper.currentDateTime(), petition.closing_date)) {
                res.statusMessage = "Bad Request: Cannot edit a petition that has closed";
                return res.status(400).send();
            }
        }

        let data = {
            "title": req.body.title,
            "description": req.body.description,
            "closing_date": req.body.closingDate
        };

        let isValidChange = false;
        for (var prop in data) {
            if (Object.prototype.hasOwnProperty.call(data, prop)) {
                if (data[prop] != undefined) {
                    isValidChange = true;
                }
            }
        }
        data.category_id = +req.body.categoryId;

        if (!isValidChange && isNaN(data.category_id)) {
            res.statusMessage = "Bad Request: no valid fields provided";
            return res.status(400).send();
        }

        // Check title is valid string
        if (data.title != undefined) {
            if (!helper.isValidString(data.title)) {
                res.statusMessage = "Bad Request: data.title is invalid";
                return res.status(400).send();
            }
        }

        // Check description is a valid string
        if (data.description != undefined) {
            if (!helper.isValidString(data.description)) {
                res.statusMessage = "Bad Request: data.description is invalid";
                return res.status(400).send();
            }
        }

        //Check closing date is in the future
        if (data.closing_date != undefined) {
            if (!helper.validateClosingDate(helper.currentDateTime(), data.closing_date)) {
                res.statusMessage = "Bad Request: Closing date must be in the future";
                return res.status(400).send();
            }
        }

        //Check categoryId is valid
        if (!isNaN(data.category_id)) {
            if (Number.isInteger(data.category_id)) {
                if (data.category_id < 0) {
                    res.statusMessage = `Bad Request: data.categoryId should be >= 0`;
                    return res.status(400).send();
                }
            } else {
                res.statusMessage = `Bad Request: categoryId should be integer`;
                return res.status(400).send();
            }
            if (await Categories.getCategory(data.category_id) == undefined) {
                res.statusMessage = "Bad Request: data.categoryId is invalid";
                return res.status(400).send();
            }
        } else {
            // No category Id has been provided
            delete data.category_id;
        }

        for (var prop in data) {
            if (Object.prototype.hasOwnProperty.call(data, prop)) {
                if (data[prop] != petition[prop] && data[prop] != undefined) {
                    await Petitions.updateField(id, prop, data[prop]);
                }
            }
        }
        return res.status(200).send();
    } catch (err) {
        return res.status(500).send(`ERROR updating petition: ${err}}`);
    }
};

/**
 * Delete a petition. Only accessible to the author of the petition. 
 * All signatures for the petition will also be deleted. 
 * @param {integer} id - ID of the petition
 */
exports.delete = async function (req, res) {
    try {
        const id = req.params.petitionId;
        const clientToken = req.headers['x-authorization'];
        const petition = await Petitions.getOne(id);

        if (petition == undefined) {
            return res.status(404).send();  // No petition matches given ID
        }
        if (clientToken == undefined || !helper.isValidString(clientToken)) {
            return res.status(401).send();
        }

        const user = await Users.userByToken(clientToken);
        if (user == undefined) {
            return res.status(401).send();
        }
        if (user.user_id != petition.author_id) {
            return res.status(403).send();  // Token belongs to another user
        }

        await Petitions.deleteOne(id);
        await Signatures.deleteAllSignatures(id);

        res.status(200).send();
    } catch (err) {
        return res.status(500).send(`ERROR deleting petition: ${err}}`);
    }
};

/**
 * Retrieve all data about petition categories.
 */
exports.categories = async function (req, res) {
    try {
        results = await Categories.getAll();
        let response = [];
        for (result of results) {
            let data = {
                "categoryId": result.category_id,
                "name": result.name,
            };
            response.push(data);
        }
        return res.status(200).send(response);
    } catch (err) {
        return res.status(500).send(`ERROR fetching petition categories: ${err}}`);
    }
};