const Users = require('../models/users.model');

exports.getUser = async function (req, res) {
    try {
        id = req.params.id;
        auth = req.headers['x-authorization'];
        result = await Users.getUser(id, auth);
        res.statusMessage = 'OK';
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

exports.loginUser = async function (req, res) {
    try {
        user = req.body;
        result = await Users.loginUser(user);
        res.statusMessage = 'Ok';
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

exports.registerUser = async function (req, res) {
    try {
        user = req.body;
        result = await Users.registerUser(user);
        res.statusMessage = 'Created';
        res.status(201).send(result);
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 400) {
            res.status(400).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};

exports.logoutUser = async function (req, res) {
    try {
        auth = req.headers['x-authorization'];
        await Users.logoutUser(auth);
        res.statusMessage = 'Ok';
        res.status(200).send();
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 401) {
            res.status(401).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};

exports.editUser = async function (req, res) {
    try {
        id = req.params.id;
        user = req.body;
        auth = req.headers['x-authorization'];
        await Users.editUser(id, user, auth);
        res.statusMessage = 'Ok';
        res.status(200).send();
    } catch (err) {
        console.log('Error:', err.message);
        if (err.code == 401) {
            res.status(401).send();
        }
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};
