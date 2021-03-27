const UsersImages = require('../controllers/users.images.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/:id/image').get(UsersImages.getUserImage);
    
    app.route(app.rootUrl + '/users/:id/image').put(UsersImages.setUserImage);

    app.route(app.rootUrl + '/users/:id/image').put(UsersImages.deleteUserImage);
};