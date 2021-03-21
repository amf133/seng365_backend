const Events = require('../controllers/events.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events').get(Events.getEvents);

    app.route(app.rootUrl + '/events').post(Events.addEvent);

    app.route(app.rootUrl + '/events/:id').get(Events.getEvent);

    app.route(app.rootUrl + '/events/:id').patch(Events.editEvent);

    app.route(app.rootUrl + '/events/:id').delete(Events.deleteEvent);

    app.route(app.rootUrl + '/events/categories').get(Events.getEventCategories);
};
