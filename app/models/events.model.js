const db = require('../../config/db');
const createError = require('./error').createError;

exports.getEvents = async function (details) {
    // Setting vars depending on the passed in params
    const startIndex = details.startIndex ? startIndex = " OFFSET " + details.startIndex : " ";
    const count = details.count ? " LIMIT " + details.count : " LIMIT 100";
    const q = details.q ? "(title LIKE '%" + details.q + "%' OR description LIKE '%" + details.q + "%')" : "1";
    const categoryIds = details.categoryIds ? " AND E.id in (SELECT event_id from event_category where category_id IN (" + details.categoryIds + "))" : "";
    const organizerId = details.organizerId ? " AND organizer_id = " + details.organizerId : "";
    const sortMapping = {
        ALPHABETICAL_ASC: "title ASC",
        ALPHABETICAL_DESC: "title DESC",
        DATE_ASC: "date ASC",
        DATE_DESC: "date DESC",
        ATTENDEES_ASC: "attendees ASC",
        ATTENDEES_DESC: "attendees DESC",
        CAPACITY_ASC: "capacity ASC",
        CAPACITY_DESC: "capacity DESC",
    }
    var sortBy = details.sortBy ? details.sortBy : "DATE_DESC";
    sortBy = sortMapping[sortBy];

    // Creating additional 'Categories array'
    const categoryString = "SELECT E.id, C.category_id FROM event E join event_category C on E.id = C.event_id";
    const eventCategories = await db.getPool().query(categoryString);
    if (!eventCategories[0]) {
        throw createError('No results', 400);
    }
    var categoriesArr = {};
    for (i=0; i < eventCategories[0].length; i++) {
        if (!categoriesArr[eventCategories[0][i].id]) {
            categoriesArr[eventCategories[0][i].id] = [];
        }
        categoriesArr[eventCategories[0][i].id].push(eventCategories[0][i].category_id);
    }

    // Sending request to DB
    const queryString = 'SELECT event_id as eventId, title, date, attendees as numAcceptedAttendees, U.first_name AS organizerFirstName, U.last_name AS organizerLastName, capacity FROM (SELECT EA.event_id, count(*) AS attendees FROM event_attendees EA GROUP BY EA.event_id) N join event E on E.id = N.event_id join user U on U.id = E.organizer_id WHERE ' + q + categoryIds + organizerId + " ORDER BY " + sortBy + count + startIndex;
    var result = await db.getPool().query(queryString);
    if (!result[0]) {
        throw createError('No results', 400);
    }

    // Adding categories array to result
    for (x=0; x<result[0].length;x++) {
        result[0][x]["categories"] = categoriesArr[result[0][x].eventId];
        delete result[0][x]["date"];
    }
    return result[0];
};

exports.addEvent = async function (auth, newEvent) {
    // Basic validation and checking auth
    if (!newEvent.title || !newEvent.description || !newEvent.categoryIds) {
        throw createError('Bad Request', 400);
    }
    if (new Date().getTime() > new Date(newEvent.date).getTime()) {
        throw createError('Bad Request', 400);
    }
    const queryString = "SELECT * from user where auth_token = '" + auth + "'";
    const result = await db.getPool().query(queryString);
    if (!result[0][0]) {
        throw createError('Unauthorized', 401);
    }
    const user = result[0][0];
    const categoryIds = newEvent['categoryIds'];
    delete newEvent['categoryIds'];
    newEvent['organizer_id'] = user.id;
    var createSQL = "INSERT INTO `event` (";
    for (const key in newEvent) {
        createSQL += "`" + key + "`, "
    }
    createSQL = createSQL.slice(0, -2, ) + ") VALUES (?)";
    const createdEvent = await db.getPool().query(createSQL, [Object.values(newEvent)]);
    const createdEventId = createdEvent[0].insertId

    for (var i=0; i < categoryIds.length; i++) {
        const query = "INSERT INTO `event_category` (`event_id`, `category_id`) VALUES ('" + createdEventId + "', '" + categoryIds[i] + "')";
        await db.getPool().query(query);
    }
    return {"eventId": createdEventId};
};
