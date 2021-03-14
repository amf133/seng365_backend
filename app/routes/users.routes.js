const Users = require('../controllers/users.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/:id').get(Users.getUser);

    app.route(app.rootUrl + '/users/login').post(Users.loginUser);

    app.route(app.rootUrl + '/users/register').post(Users.registerUser);

    app.route(app.rootUrl + '/users/logout').post(Users.logoutUser);

    app.route(app.rootUrl + '/users/:id').patch(Users.editUser);
};
