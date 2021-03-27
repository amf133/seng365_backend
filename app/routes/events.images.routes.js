const EventsImages = require('../controllers/events.images.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events/:id/image').get(EventsImages.getEventImage);
    
    app.route(app.rootUrl + '/events/:id/image').put(EventsImages.setEventImage);
};