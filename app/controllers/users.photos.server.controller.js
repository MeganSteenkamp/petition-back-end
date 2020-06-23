/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Endpoints for retrieving, uploading and deleting user profile photos.
 */

const helper = require('../helpers/miscellaneous.helper.js');
const Users = require('../models/users.server.model');
const UserPhoto = require('../models/users.photo.server.model');
const photo = require('../helpers/photo.helper.js');
const photosDirectory = './storage/photos/';

/**
 * Retrieve a user's profile photo.
 * @param {integer} id - ID of the user
 */
exports.getPhoto = async function (req, res) {
    try {
        const userId = req.params.userId;
        const user = await Users.getUser(userId);

        if (!user) {
            return res.status(404).send(); // User does not exist
        }

        const filename = user.photo_filename;
        if (filename == null) {
            return res.status(404).send();  // User has no profile photo
        }

        const imageDetails = await photo.getPhoto(photosDirectory, filename);
        if (!imageDetails) {
            return res.status(404).send();
        }
        return res.status(200).contentType(imageDetails.mimeType).send(imageDetails.image);
    } catch (err) {
        return res.status(500).send(`ERROR getting profile photo: ${err}`)
    }
}

/**
 * Set a user's profile photo.
 * @param {integer} id - ID of the user
 */
exports.setPhoto = async function (req, res) {
    try {
        const id = req.params.userId;
        const photoType = req.headers['content-type'];
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

        let validTypes = ['image/png', 'image/jpeg', 'image/gif'];
        if (validTypes.indexOf((photoType).toLowerCase()) == -1) {
            res.statusMessage = `Bad Request: photo must be image/jpeg, image/png, image/gif type, but it was: ${req.headers['content-type']}`;
            return res.status(400).send();
        }

        const ext = photo.getfileExtension(req.headers['content-type']);
        const filename = `user_${user.user_id}.${ext}`;

        if (user.photo_filename) {
            // User is replacing an existing photo
            await UserPhoto.updatePhoto(user.user_id, filename);
            await photo.deletePhoto(photosDirectory, user.photo_filename);
            await photo.writePhoto(photosDirectory, filename, req.body);
            return res.status(200).send();
        } else {
            await UserPhoto.updatePhoto(user.user_id, filename);
            await photo.writePhoto(photosDirectory, filename, req.body);
            return res.status(201).send();
        }
    } catch (err) {
        return res.status(500).send(`ERROR setting profile photo: ${err}`)
    }
}

exports.deletePhoto = async function (req, res) {
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

        if (user.photo_filename == null) {
            return res.status(404).send();
        }

        await UserPhoto.updatePhoto(user.user_id, null);
        await photo.deletePhoto(photosDirectory, user.photo_filename);
        return res.status(200).send();
    } catch (err) {
        return res.status(500).send(`ERROR deleting profile photo: ${err}`)
    }
}
