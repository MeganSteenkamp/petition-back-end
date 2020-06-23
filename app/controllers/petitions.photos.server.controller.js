/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Endpoints for retrieving and uploading petition hero images.
 */

const Petitions = require('../models/petitions.server.model');
const Users = require('../models/users.server.model');
const PetitionPhoto = require('../models/petitions.photo.server.model');
const photo = require('../helpers/photo.helper.js');
const photosDirectory = './storage/photos/';

/**
 * Retrieve a petition's hero image
 * @param {integer} id - ID of the petition
 */
exports.getPhoto = async function (req, res) {
    try {
        const petitionId = req.params.petitionId;
        const petition = await Petitions.getOne(petitionId);

        if (!petition) {
            return res.status(404).send(); // User does not exist
        }

        const filename = petition.photo_filename;
        if (filename == null) {
            return res.status(404).send();  // User has no profile photo
        }

        const imageDetails = await photo.getPhoto(photosDirectory, filename);
        if (!imageDetails) {
            return res.status(404).send();
        }
        return res.status(200).contentType(imageDetails.mimeType).send(imageDetails.image);
    } catch (err) {
        return res.status(500).send(`ERROR fetching petition hero image: ${err}}`);
    }
};

/**
 * Set a petition's hero image
 * @param {integer} id - ID of the petition
 */
exports.setPhoto = async function (req, res) {
    try {
        const id = req.params.petitionId;
        const photoType = req.headers['content-type'];
        const clientToken = req.headers['x-authorization'];
        const petition = await Petitions.getOne(id);

        if (!petition) {
            return res.status(404).send();  // No petition matches given ID
        }
        if (!clientToken) {
            return res.status(401).send();
        }

        const user = await Users.userByToken(clientToken);
        if (!user) {
            return res.status(401).send();
        }
        if (user.user_id != petition.author_id) {
            return res.status(403).send();  // Token belongs to another user
        }

        let validTypes = ['image/png', 'image/jpeg', 'image/gif'];
        if (validTypes.indexOf((photoType).toLowerCase()) == -1) {
            res.statusMessage = `Bad Request: photo must be image/jpeg, image/png, image/gif type, but it was: ${req.headers['content-type']}`;
            return res.status(400).send();
        }

        const ext = photo.getfileExtension(req.headers['content-type']);
        const filename = `petition_${petition.petition_id}.${ext}`;

        if (petition.photo_filename) {
            // User is replacing an petition hero image
            await PetitionPhoto.updatePhoto(petition.petition_id, filename);
            await photo.deletePhoto(photosDirectory, petition.photo_filename);
            await photo.writePhoto(photosDirectory, filename, req.body);
            return res.status(200).send();
        } else {
            await PetitionPhoto.updatePhoto(petition.petition_id, filename);
            await photo.writePhoto(photosDirectory, filename, req.body);
            return res.status(201).send();
        }
    } catch (err) {
        return res.status(500).send(`ERROR setting petition hero image: ${err}}`);
    }
};