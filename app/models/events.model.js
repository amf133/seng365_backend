const db = require('../../config/db');
const createError = require('./error').createError;

exports.getEvents = async function (details) {
    // Setting vars depending on the passed in params
    const startIndex = details.startIndex ? " OFFSET " + (details.startIndex) : " ";
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

    //checking if given categories actually exist. This is so inefficient, I know
    if (details.categoryIds) {
        for (var i = 0; i<details.categoryIds.length; i++) {
            var categoryCheckString = "SELECT * from category WHERE id = " + details.categoryIds[i].trim();
            var eventCategoriesCheck = await db.getPool().query(categoryCheckString);
            if (!eventCategoriesCheck[0][0]) {
                throw createError('Bad Request', 400);
            }
        }
    }
    
    
    // Creating additional 'Categories array'
    const categoryString = "SELECT E.id, C.category_id FROM event E join event_category C on E.id = C.event_id";
    const eventCategories = await db.getPool().query(categoryString);

    var categoriesArr = {};
    for (i=0; i < eventCategories[0].length; i++) {
        if (!categoriesArr[eventCategories[0][i].id]) {
            categoriesArr[eventCategories[0][i].id] = [];
        }
        categoriesArr[eventCategories[0][i].id].push(eventCategories[0][i].category_id);
    }

    // Sending request to DB
    const queryString = 'SELECT event_id as eventId, title, date, attendees as numAcceptedAttendees, U.first_name AS organizerFirstName, U.last_name AS organizerLastName, capacity FROM (SELECT EA.event_id, count(*) AS attendees FROM event_attendees EA WHERE attendance_status_id = 1 GROUP BY EA.event_id) N join event E on E.id = N.event_id join user U on U.id = E.organizer_id WHERE ' + q + categoryIds + organizerId + " ORDER BY " + sortBy + count + startIndex;
    var result = await db.getPool().query(queryString);
    if (!result[0][0]) {
        return [];
    }

    // Adding categories array to result
    for (x=0; x<result[0].length;x++) {
        result[0][x]["categories"] = categoriesArr[result[0][x].eventId];
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
   
    try {
        var createdEvent = await db.getPool().query(createSQL, [Object.values(newEvent)]);
    } catch(err) {
        if (err.errno == 1062) {
            throw createError('Event already exists!', 400);
        }
        throw createError('Bad Request', 400);
    }
    
    const createdEventId = createdEvent[0].insertId

    for (var i=0; i < categoryIds.length; i++) {
        const query = "INSERT INTO `event_category` (`event_id`, `category_id`) VALUES ('" + createdEventId + "', '" + categoryIds[i] + "')";
        await db.getPool().query(query);
    }
    const attendeesQuery = "INSERT INTO `event_attendees` (`event_id`, `user_id`, `attendance_status_id`, `date_of_interest`) VALUES ('" + createdEventId + "', '" + result[0][0].id + "', '" + 1 + "', '" + new Date().toISOString().slice(0, 19).replace('T', ' ') + "')";
    await db.getPool().query(attendeesQuery);
    return {"eventId": createdEventId};
};

exports.getEvent = async function (id) {
    var categories = await getEventCategories(id);
    const eventsQuery = "SELECT E.id as eventId, E.title, U.first_name AS organizerFirstName, U.last_name AS organizerLastName, A.numAcceptedAttendees, E.capacity, E.description, E.organizer_id, E.date, E.is_online as isOnline, E.url, E.venue, E.requires_attendance_control AS requiresAttendanceControl, E.fee from event E join user U on E.organizer_id = U.id join (SELECT EA.event_id, count(*) AS numAcceptedAttendees FROM event_attendees EA GROUP BY EA.event_id) A on A.event_id = E.id where E.id = '" + id + "'";
    const result = await db.getPool().query(eventsQuery);
    if (!result[0][0]) {
        throw createError('Event not found', 404);
    }
    eventResult = result[0][0];
    eventResult["isOnline"] = Boolean(eventResult["isOnline"]);
    eventResult["requiresAttendanceControl"] = Boolean(eventResult["requiresAttendanceControl"]);
    eventResult["categories"] = categories[id];
    return eventResult;
};

async function getEventCategories(id) {
    // Creating additional 'Categories array'
    const categoryString = "SELECT E.id, C.category_id FROM event E join event_category C on E.id = C.event_id where E.id = '" + id + "'";
    const eventCategories = await db.getPool().query(categoryString);
    if (!eventCategories[0]) {
        throw createError('No category results', 400);
    }
    var categoriesArr = {};
    for (i=0; i < eventCategories[0].length; i++) {
        if (!categoriesArr[eventCategories[0][i].id]) {
            categoriesArr[eventCategories[0][i].id] = [];
        }
        categoriesArr[eventCategories[0][i].id].push(eventCategories[0][i].category_id);
    }
    return categoriesArr;
}

exports.editEvent = async function (auth, eventId, newEvent) {
    // Check event organizer auth token matches given
    try {
        currentEvent = await checkAuthGetCurrentEvent(auth, eventId);
    } catch (err) {
        throw err;
    }
    if (currentEvent.date < new Date()) {
        throw createError('Bad Request', 400);
    }
    delete currentEvent["auth_token"];
    delete currentEvent["UID"];
    
    // Validate newEvent categories 
    validCategoriesQuery = "SELECT count(*) AS count from category where id in (" + newEvent.categoryIds + ")";
    validCategory = await db.getPool().query(validCategoriesQuery);
    validCategory = validCategory[0][0];
    if (validCategory.count != newEvent.categoryIds.length) {
        throw createError('Invalid categories', 400);
    }

    // Remove existing category id's
    deleteEventCategories(eventId);

    // Add new category id's
    for (var i = 0; i < newEvent.categoryIds.length; i++) {
        insertCategoryQuery = "INSERT INTO `event_category` (`event_id`, `category_id`) VALUES ('" + eventId + "', '" + newEvent.categoryIds[i] + "')";
        db.getPool().query(insertCategoryQuery);
    }
    delete newEvent["categoryIds"];
    currentEvent = Object.assign(currentEvent, newEvent);
    
    // Save to database
    saveSql =
        "UPDATE event SET title = '" +
        currentEvent.title +
        "', description = '" +
        currentEvent.description +
        "', date = '" +
        currentEvent.date.toISOString().slice(0, 19).replace('T', ' ') +
        (currentEvent.image_filename ? ("', image_filename = '" + currentEvent.image_filename) : "") +
        "', is_online = '" +
        currentEvent.is_online +
        (currentEvent.url ? ("', url = '" + currentEvent.url) : "") +
        "', venue = '" +
        currentEvent.venue +
        (currentEvent.capacity ? ("', capacity = '" + currentEvent.capacity) : "") +
        "', requires_attendance_control = '" +
        currentEvent.requires_attendance_control +
        "', fee = '" +
        currentEvent.fee +
        "', organizer_id = '" +
        currentEvent.organizer_id +
        "' WHERE id = '" +
        currentEvent.id +
        "'";
    await db.getPool().query(saveSql);
};

exports.deleteEvent = async function (auth, eventId) {
    // Check event organizer auth token matches given
    try {
        currentEvent = await checkAuthGetCurrentEvent(auth, eventId);
    } catch (err) {
        throw err;
    }
    // Remove existing category id's
    await deleteEventCategories(eventId);
    await db.getPool().query("DELETE FROM event_attendees WHERE event_id = " + eventId);
    await db.getPool().query("DELETE FROM event WHERE id = " + eventId);
};

exports.getEventCategories = async function () {
    result = await db.getPool().query("SELECT id AS categoryId, name FROM category");
    return result[0];
};

async function deleteEventCategories(eventId) {
    deleteCategoryQuery = "DELETE FROM event_category WHERE event_id = " + eventId;
    await db.getPool().query(deleteCategoryQuery);
}

async function checkAuthGetCurrentEvent(auth, eventId) {
    if (!auth) {
        throw createError('Unauthorized', 401);
    }
    const authQuery = "SELECT * FROM event E join (SELECT id AS UID, auth_token from user) U on E.organizer_id = UID where E.id ='" + eventId + "'";
    currentEvent = await db.getPool().query(authQuery);
    currentEvent = currentEvent[0][0];
    if (!currentEvent) {
        throw createError('Not found', 404);
    } else if (currentEvent.auth_token != auth) {
        throw createError('Forbidden', 403);
    }
    return currentEvent;
}