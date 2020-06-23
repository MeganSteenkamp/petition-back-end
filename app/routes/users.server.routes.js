/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Imports a users controller and then defines each of the 
 *              relevant routes as outlined in the specification. 
 */

const users = require('../controllers/users.server.controller');
const userPhoto = require('../controllers/users.photos.server.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/register')
        .post(users.create);
    app.route(app.rootUrl + '/users/login')
        .post(users.login);
    app.route(app.rootUrl + '/users/logout')
        .post(users.logout);
    app.route(app.rootUrl + '/users/:userId')
        .get(users.read)
        .patch(users.update);
    app.route(app.rootUrl + '/users/:userId/photo')
        .get(userPhoto.getPhoto)
        .put(userPhoto.setPhoto)
        .delete(userPhoto.deletePhoto);
};