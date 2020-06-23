/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Endpoints for retrieving, adding, and deleting signatures for petitions.
 */

const Petitions = require('../models/petitions.server.model');
const Signatures = require('../models/signatures.server.model');
const Users = require('../models/users.server.model');
const helper = require('../helpers/miscellaneous.helper.js');

/**
 * Retrieve a petition's signatures
 * @param {integer} id - ID of the petition
 */
exports.read = async function (req, res) {
    try {
        const id = req.params.petitionId;
        const petition = await Petitions.getOne(id);
        if (petition == undefined) {
            return res.status(404).send();  // No petition matches given ID
        }
        const results = await Signatures.getAll(id);
        return res.status(200).send(results);
    } catch (err) {
        return res.status(500).send(`ERROR fetching petition signatures: ${err}}`);
    }
};

/**
 * Sign a petition.
 * @param {integer} id - ID of the petition
 */
exports.sign = async function (req, res) {
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

        // Check petition has not already closed
        const today = helper.currentDateTime();
        if (!helper.validateClosingDate(today, petition.closing_date)) {
            res.statusMessage = "Forbidden: cannot sign a petition that has already closed";
            return res.status(403).send();
        }

        const result = await Signatures.signPetition(user.user_id, id, today);
        return res.status(201).send();
    } catch (err) {
        if (err.sqlState == '23000') {
            res.statusMessage = "Forbidden: cannot sign the same petition twice";
            return res.status(403).send();
        }
        return res.status(500).send(`ERROR signing petition: ${err}}`);
    }
};

/**
 * Remove a signature from a petition.
 * @param {integer} id - ID of the petition
 */
exports.removeSignature = async function (req, res) {
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
        if (petition.author_id == user.user_id) {
            res.statusMessage = "Forbidden: cannot remove signature from a petition you created";
            return res.status(403).send();
        }

        // Check petition has not already closed
        const today = helper.currentDateTime();
        if (!helper.validateClosingDate(today, petition.closing_date)) {
            res.statusMessage = "Forbidden: cannot sign a petition that has already closed";
            return res.status(403).send();
        }

        const result = await Signatures.removeSignature(id, user.user_id);
        if (result) {
            return res.status(200).send();
        } else {
            res.statusMessage = "Forbidden: cannot remove signature from a petition without first signing it";
            return res.status(403).send();
        }
    } catch (err) {
        return res.status(500).send(`ERROR removing signature from petition: ${err}}`);
    }
};