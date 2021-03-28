const db = require('../../config/db');
const createError = require('./error').createError;
const fs = require('mz/fs')
const path = require('path')

exports.getUserImage = async function (userId) {
    const getImageQuery = "SELECT image_filename FROM user WHERE id = " + userId;
    try {
        var imageFilename = await db.getPool().query(getImageQuery);
    } catch (err) {
        // User submits invalid userId
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

exports.setUserImage = async function (userId, auth, image, contentType) {
    // Error checking
    if (!auth) {
        throw createError('Unorthorized', 401);
    }
    if (!contentType || !image || !userId) {
        throw createError('Bad Request', 400);
    }
    const query = "SELECT image_filename, auth_token FROM user WHERE id = " + userId;
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

    const newImageName = `user_${userId}.${extension}`;
    const imageNameQuery = "UPDATE user SET image_filename = '" + newImageName + "' WHERE id = " + userId;
    db.getPool().query(imageNameQuery);
    try {
        fs.writeFileSync(`./storage/images/${newImageName}`, image);
    } catch (err) {
        throw createError('Bad Request', 400); // failed if not image
    }
    return returnStatus;
};

exports.deleteUserImage = async function (userId, auth) {
    // Error checking
    if (!auth) {
        throw createError('Unorthorized', 401);
    }
    const query = "SELECT image_filename, auth_token FROM user WHERE id = " + userId;
    result = await db.getPool().query(query);
    if (!result[0][0] || !result[0][0].image_filename) {
        throw createError('Not Found', 404);
    }
    if (auth != result[0][0].auth_token) {
        throw createError('Forbidden', 403);
    }

    fs.rmSync(`./storage/images/${result[0][0].image_filename}`);

    const imageNameQuery = "UPDATE user SET image_filename = null WHERE id = " + userId;
    db.getPool().query(imageNameQuery);
};