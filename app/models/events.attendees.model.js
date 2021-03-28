const db = require('../../config/db');
const createError = require('./error').createError;

exports.getEventAttendees = async function (eventId, auth) {
    try {
        userAuth = await isUserAdminOfEvent(eventId, auth);
    } catch (err) {
        throw createError('Not found', 404);
    }
    if (auth && userAuth) {
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
    try {
        var userId = await authAndGetUserId(auth);
    } catch (err) {
        throw err;
    }
    
    // Ensure event is in past and that there is an event with the given id
    dateQuery = "SELECT E.date FROM event E join event_attendees A on E.id = A.event_id where E.id = " + eventId;
    var preDate = await db.getPool().query(dateQuery);
    if (!preDate[0][0].date) {
        throw createError('No event found', 404);
    }
    if (new Date(preDate[0][0].date).getTime() <= new Date().getTime()) {
        throw createError('Event has already been', 400);
    }
    // User cannot already be part of the event
    attendeeQuery = "SELECT * FROM event_attendees A WHERE A.event_id = '" + eventId + "' AND user_id = " + userId;
    var preAttendee = await db.getPool().query(attendeeQuery);
    if (preAttendee[0][0]) {
        throw createError('Already on event list', 403);
    }
    resultQuery = "INSERT INTO `event_attendees` (`event_id`, `user_id`, `attendance_status_id`, `date_of_interest`) VALUES (" + eventId + ", " + userId + ", " + 2 + ", '" + new Date().toISOString().slice(0, 19).replace('T', ' ') + "')";
    result = await db.getPool().query(resultQuery);
};

exports.removeEventAttendee = async function (eventId, auth) {
    try {
        var userId = await authAndGetUserId(auth);
    } catch (err) {
        throw err;
    }
    // Not apart of event, event in past or status rejected
    checkQuery = "SELECT * FROM event_attendees A join event E on E.id = A.event_id WHERE A.user_id = " + userId + " AND E.id = " + eventId + " AND E.date > CURRENT_DATE AND A.attendance_status_id <> 3";
    check = await db.getPool().query(checkQuery);
    if (!check[0][0]) {
        throw createError('Bad Request', 400);
    }
    resultQuery = "DELETE FROM event_attendees WHERE user_id = " + userId + " AND event_id = " + eventId;
    db.getPool().query(resultQuery);
};

exports.editAttendeeStatus = async function (auth, userId, eventId, status) {
    // Check user is admin of event
    if (!auth) {
        throw createError('Unauthorized', 401);
    }
    var userId = await db.getPool().query("SELECT U.id FROM user U join event E on E.organizer_id = U.id WHERE auth_token = '" + auth + "' AND E.id = " + eventId);
    if (!userId[0][0]) {
        throw createError('Forbidden', 403);
    }

    statusMap = {
        "accepted": 1,
        "pending": 2,
        "rejected": 3,
    }
    status = statusMap[status];
    resultQuery = "UPDATE event_attendees SET attendance_status_id = " + status + " WHERE user_id = " + userId[0][0].id + " AND event_id = " + eventId;
    try {
        await db.getPool().query(resultQuery);
    } catch (err) {
        if (err.errno == 1054) {
            throw createError('Not Found', 404);
        }
        throw createError('Bad request', 400);
    }
};

async function isUserAdminOfEvent(eventId, auth) {
    user = await db.getPool().query("SELECT * from user U join event E on U.id = E.organizer_id WHERE E.id = " + eventId);
    return user[0][0].auth_token == auth;
}

async function authAndGetUserId(auth) {
    if (!auth) {
        throw createError('Unauthorized', 401);
    }
    var userId = await db.getPool().query("SELECT id FROM user WHERE auth_token = '" + auth + "'");
    if (!userId[0][0]) {
        throw createError('Forbidden', 403);
    }
    return userId[0][0].id;
}