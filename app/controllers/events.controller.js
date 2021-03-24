const Events = require('../models/events.model');

exports.getEvents = async function (req, res) {
    try {
        details = req.query;
        result = await Events.getEvents(details);
        res.statusMessage = 'OK';
        res.status(200).send(result);
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 400) {
            res.status(400).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};

exports.addEvent = async function (req, res) {
    try {
        auth = req.headers['x-authorization'];
        newEvent = req.body;
        result = await Events.addEvent(auth, newEvent);
        res.statusMessage = 'Created';
        res.status(201).send(result);
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 400) {
            res.status(400).send();
        } else if (err.code == 401) {
            res.status(401).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};

exports.getEvent = async function (req, res) {
    try {
        eventId = req.params.id;
        result = await Events.getEvent(eventId);
        res.statusMessage = 'Ok';
        res.status(200).send(result);
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 400) {
            res.status(400).send();
        } else if (err.code == 404) {
            res.status(404).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};

exports.editEvent = async function (req, res) {
    try {
        auth = req.headers['x-authorization'];
        newEvent = req.body;
        eventId = req.params.id;
        await Events.editEvent(auth, eventId, newEvent);
        res.statusMessage = 'Ok';
        res.status(200).send();
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

exports.deleteEvent = async function (req, res) {
    try {
        eventId = req.params.id;
        auth = req.headers['x-authorization'];
        await Events.deleteEvent(auth, eventId);
        res.statusMessage = 'Ok';
        res.status(200).send();
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 401) {
            res.status(401).send();
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

exports.getEventCategories = async function (req, res) {
    try {
        result = await Events.getEventCategories();
        res.statusMessage = 'Ok';
        res.status(200).send(result);
    } catch (err) {
        console.log('Error:', err.message);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};