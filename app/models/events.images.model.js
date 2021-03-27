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

exports.setEventImage = async function (eventId, auth, image) {
    // make sure user is event organizer
    const query = "SELECT E.image_filename FROM user U join event E on U.id = E.organizer_id WHERE U.auth_token = '" + auth + "'";
    result = await db.getPool().query(query);
    console.log(result[0][0].image_filename);
    if (result[0][0].image_filename) {
        // Image already exists: override current
    }
    


    return "Created";
    // Or return "Updated"
};