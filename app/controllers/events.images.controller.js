const EventsImages = require('../models/events.images.model');

exports.getEventImage = async function (req, res) {
    try {
        eventId = req.params.id;
        result = await EventsImages.getEventImage(eventId);
        res.statusMessage = 'OK';
        res.setHeader("Content-Type", "image/gif");
        if (result[1] == '.jpg') {
            res.setHeader("Content-Type", "image/jpeg");
        } else if (result[1] == '.png') {
            res.setHeader("Content-Type", "image/png");
        }
        res.status(200).send(result[0]);
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 404) {
            res.status(404).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};

exports.setEventImage = async function (req, res) {
    try {
        const eventId = req.params.id
        const auth = req.headers['x-authorization'];
        const image = req.body;
        const contentType = req.headers['content-type'];
        result = await EventsImages.setEventImage(eventId, auth, image, contentType);
        if (result == "Ok") {
            res.statusMessage = result;
            res.status(200).send();
        }
        res.statusMessage = result;
        res.status(201).send();
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 400) {
            res.status(400).send();
        } else if (err.code == 401) {
            res.status(401).send();
        } else if (err.code == 403) {
            res.status(403).send();
        } else if (err.code == 404) {
            res.status(404).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};