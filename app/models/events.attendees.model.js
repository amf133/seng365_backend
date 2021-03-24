const db = require('../../config/db');
const createError = require('./error').createError;

exports.getEventAttendees = async function (eventId, auth) {
    if (auth && await isUserAdminOfEvent(eventId, auth)) {
        var query = "SELECT U.id AS attendeeId, S.name AS status, U.first_name AS firstName, U.last_name AS lastName, A.date_of_interest AS dateOfInterest FROM event_attendees A join user U on A.user_id = U.id join attendance_status S on S.id = A.attendance_status_id WHERE event_id = " + eventId + " ORDER BY A.date_of_interest ASC";
    } else {
        const whereString = auth ? " OR U.auth_token = '" + auth + "'" : "";
        var query = "SELECT U.id AS attendeeId, S.name AS status, U.first_name AS firstName, U.last_name AS lastName, A.date_of_interest AS dateOfInterest FROM event_attendees A join user U on A.user_id = U.id join attendance_status S on S.id = A.attendance_status_id WHERE event_id = " + eventId + " AND (S.name = 'accepted'" + whereString + ") ORDER BY A.date_of_interest ASC";
    }

    result = await db.getPool().query(query);
    if (!result[0]) {
        throw createError('Not found', 404);
    }
    return result[0]
};

exports.requestEventAttendance = async function (eventId, auth) {
    if (!auth) {
        throw createError('Unauthorized', 401);
    }
    var userId = await db.getPool().query("SELECT id FROM user WHERE auth_token = '" + auth + "'");
    userid = userId;
    if (!userId) {
        throw createError('Forbidden', 403);
    }
    query = "INSERT INTO `event_attendees` (`event_id`, `user_id`, `attendance_status_id`, `date_of_interest`) VALUES (" + eventId + ", " + userId[0][0].id + ", " + 2 + ", '" + new Date().toISOString().slice(0, 19).replace('T', ' ') + "')";
    // TODO ----------------------- QUERY THE DB FIRST, CHECK DATE IN FUTURE, NOT ALREADY IN THE EVENT -------------------------------
};

exports.removeEventAttendee = async function (id, auth) {
    // Setting vars depending on the passed in params
};

exports.editAttendeeStatus = async function (auth, userId, eventId, status) {
    // Setting vars depending on the passed in params
};

async function isUserAdminOfEvent(eventId, auth) {
    user = await db.getPool().query("SELECT * from user U join event E on U.id = E.organizer_id WHERE E.id = " + eventId);
    return user[0][0].auth_token == auth;
}
