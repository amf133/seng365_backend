const db = require('../../config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

exports.getUser = async function (id, auth) {
    const sql =
        'SELECT first_name, last_name, email, auth_token FROM user WHERE id = ' +
        id;
    result = await db
        .getPool()
        .query(sql)
        .then((result) => {
            return result[0][0]; // I want to learn a better way to use promises than this
        });
    if (!result) {
        throwError('Not found', 400);
    }
    if (result.auth_token != auth) {
        delete result['email'];
    }
    delete result['auth_token'];
    return result;
};

exports.registerUser = async function (user) {
    // Validation
    const emailQuery = "SELECT * from user where email = '" + user.email + "'";
    emailResult = await db
        .getPool()
        .query(emailQuery)
        .then((emailResult) => {
            return emailResult[0];
        });
    if (user.password == '') {
        throwError('Password cannot be empty', 400);
    } else if (emailResult.length != 0) {
        throwError('Email already in use', 400);
    } else if (!user.email.includes('@')) {
        throwError('Invalid email address', 400);
    }

    // Saving the user
    user.password = await bcrypt.hash(user.password, 10);
    const sql =
        'INSERT INTO `user` (`first_name`, `last_name`, `email`, `password`) VALUES (?)';
    result = await db
        .getPool()
        .query(sql, [Object.values(user)])
        .then((result) => {
            return result[0].insertId;
        });
    return { userId: result };
};

exports.loginUser = async function (user) {
    // Checking login info
    const sql = "SELECT * FROM user WHERE email = '" + user.email + "'";
    result = await db
        .getPool()
        .query(sql)
        .then((result) => {
            return result[0][0];
        });
    bcrypt.compare(user.password, result.password, function (err, result) {
        if (!result) {
            throwError('Invalid username/password combination', 400);
        }
    });

    // Generating and saving token
    token = uuidv4();
    const tokenSql =
        "UPDATE user SET auth_token = '" +
        token +
        "' WHERE email = '" +
        user.email +
        "'";
    db.getPool().query(tokenSql);
    return { userId: result.id, token: token };
};

exports.logoutUser = async function (auth) {
    const sql =
        "UPDATE user set auth_token = NULL WHERE auth_token = '" + auth + "'";
    affectedRows = await db
        .getPool()
        .query(sql)
        .then((result) => {
            return result[0].affectedRows;
        });

    if (affectedRows == 0) {
        throwError('Unauthorized', 401);
    }
};

exports.editUser = async function (id, newUser, auth) {
    if (!auth) {
        throwError('Unauthorized', 401);
    }
    const sql = "SELECT * FROM user where id ='" + id + "'";
    currentUser = await db
        .getPool()
        .query(sql)
        .then((result) => {
            return result[0][0];
        });
    if (!currentUser) {
        throwError('Not found', 404);
    } else if (currentUser.auth_token != auth) {
        throwError('Forbidden', 403);
    }

    // Validate newUser email
    if (newUser.email) {
        if (!newUser.email.includes('@')) {
            throwError('Invalid email address', 400);
        }
        const emailSql =
            "SELECT * FROM user where email ='" + newUser.email + "'";
        emailResult = await db
            .getPool()
            .query(emailSql)
            .then((result) => {
                return result[0];
            });
        if (emailResult.length != 0) {
            throwError('Email address in use', 400);
        }
    }

    console.log('Current user before merge:', currentUser);
    currentUser = Object.assign(currentUser, newUser);
    console.log('Current user after merge:', currentUser);

    // TODO: add functions for checking email/password, etc.
    // TODO: save to database
    return;
};

function throwError(message, code) {
    const error = new Error(message);
    error.code = code;
    throw error;
}
