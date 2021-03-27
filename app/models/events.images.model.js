const db = require('../../config/db');
const createError = require('./error').createError;
const fs = require('mz/fs')
const path = require('path')

exports.getEventImage = async function (eventId) {
    const getImageQuery = "SELECT image_filename FROM event WHERE id = " + eventId;
    try {
        var imageFilename = await db.getPool().query(getImageQuery);
    } catch (err) {
        // User submits invalid eventId
        throw createError('Not Found', 404);
    }
    // Image file is null
    if (!imageFilename[0][0] || !imageFilename[0][0].image_filename) {
        throw createError('Not Found', 404);
    }

    const extension = path.extname(`${imageFilename[0][0].image_filename}`);
    const data = fs.readFileSync(`./storage/images/${imageFilename[0][0].image_filename}`, async function (err,data) {
        if (err) {
            throw createError('Bad Request', 400);
        }
        
        return data;
    });
    return [data, extension];
};

exports.setEventImage = async function (eventId, auth, image, contentType) {
    // Error checking
    if (!auth) {
        throw createError('Unorthorized', 401);
    }
    if (!contentType || !image || !eventId) {
        throw createError('Bad Request', 400);
    }
    const query = "SELECT E.image_filename, U.auth_token FROM user U join event E on U.id = E.organizer_id WHERE E.id = " + eventId;
    result = await db.getPool().query(query);
    if (!result[0][0]) {
        throw createError('Not Found', 404);
    }
    if (auth != result[0][0].auth_token) {
        throw createError('Forbidden', 403);
    }
    var extension = "gif";
    if (contentType == "image/png") {
        extension = "png";
    } else if (contentType == "image/jpeg") {
        extension = "jpg";
    }
    var returnStatus = "Ok";

    if (!result[0][0].image_filename) {
        returnStatus = "Created";
    } else {
        fs.rmSync(`./storage/images/${result[0][0].image_filename}`);
    }

    const newImageName = `event_${eventId}.${extension}`;
    const imageNameQuery = "UPDATE event SET image_filename = '" + newImageName + "' WHERE id = " + eventId;
    db.getPool().query(imageNameQuery);
    fs.writeFileSync(`./storage/images/${newImageName}`, image);
    return returnStatus;
};