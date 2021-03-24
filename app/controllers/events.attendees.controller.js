const EventsAttendees = require('../models/events.attendees.model');

exports.getEventAttendees = async function (req, res) {
    try {
        id = req.params.id;
        auth = req.headers['x-authorization'];
        result = await EventsAttendees.getEventAttendees(id, auth);
        res.statusMessage = 'OK';
        res.status(200).send(result);
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 404) {
            res.status(404).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};

exports.requestEventAttendance = async function (req, res) {
    try {
        id = req.params.id
        auth = req.headers['x-authorization'];
        await EventsAttendees.requestEventAttendance(id, auth);
        res.statusMessage = 'Created';
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

exports.removeEventAttendee = async function (req, res) {
    try {
        id = req.params.id
        auth = req.headers['x-authorization'];
        await EventsAttendees.removeEventAttendee(id, auth);
        res.statusMessage = 'Ok';
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

exports.editAttendeeStatus = async function (req, res) {
    try {
        userId = req.params.userId
        eventId = req.params.eventId
        auth = req.headers['x-authorization'];
        status = req.body.status;
        await EventsAttendees.editAttendeeStatus(auth, userId, eventId, status);
        res.statusMessage = 'Ok';
        res.status(200).send();
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 400) {
            res.status(400).send();
        } else if (err.code == 401) {
            res.status(401).send();
        }else if (err.code == 403) {
            res.status(403).send();
        } else if (err.code == 404) {
            res.status(404).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};