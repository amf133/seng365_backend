const EventsAttendees = require('../controllers/events.attendees.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events/:id/attendees').get(EventsAttendees.getEventAttendees);
    
    app.route(app.rootUrl + '/events/:id/attendees').post(EventsAttendees.requestEventAttendance);

    app.route(app.rootUrl + '/events/:id/attendees').delete(EventsAttendees.removeEventAttendee);

    app.route(app.rootUrl + '/events/:eventId/attendees/:userId').patch(EventsAttendees.editAttendeeStatus);
};