/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Defines each of the relevant routes for petitions as outlined in the specification. 
 */

const petitions = require('../controllers/petitions.server.controller');
const petitionSignatures = require('../controllers/petitions.signatures.server.controller');
const petitionPhotos = require('../controllers/petitions.photos.server.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/petitions')
        .get(petitions.read)
        .post(petitions.create);
    app.route(app.rootUrl + '/petitions/categories')
        .get(petitions.categories);
    app.route(app.rootUrl + '/petitions/:petitionId')
        .get(petitions.readOne)
        .patch(petitions.update)
        .delete(petitions.delete);
    app.route(app.rootUrl + '/petitions/:petitionId/signatures')
        .get(petitionSignatures.read)
        .post(petitionSignatures.sign)
        .delete(petitionSignatures.removeSignature);
    app.route(app.rootUrl + '/petitions/:petitionId/photo')
        .get(petitionPhotos.getPhoto)
        .put(petitionPhotos.setPhoto);
};