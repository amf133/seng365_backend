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
        throw createError('Not found', 400);
    }
    if (result.auth_token != auth) {
        delete result['email'];
    }
    delete result['auth_token'];
    return result;
};

exports.registerUser = async function (user) {
    // Validation
    emailResult = await getEmailQuery(user.email);
    if (emailResult.length != 0) {
        throw createError('Email already in use', 400);
    } else if (!user.email.includes('@')) {
        throw createError('Invalid email address', 400);
    }
    if (user.password == '') {
        throw createError('Password cannot be empty', 400);
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
            throw createError('Invalid username/password combination', 400);
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
        throw createError('Unauthorized', 401);
    }
};

exports.editUser = async function (id, newUser, auth) {
    // Check auth, id
    if (!auth) {
        throw createError('Unauthorized', 401);
    }
    const sql = "SELECT * FROM user where id ='" + id + "'";
    currentUser = await db
        .getPool()
        .query(sql)
        .then((result) => {
            return result[0][0];
        });
    if (!currentUser) {
        throw createError('Not found', 404);
    } else if (currentUser.auth_token != auth) {
        throw createError('Forbidden', 403);
    }

    // Validate newUser email, password
    if (newUser.email) {
        emailResult = await getEmailQuery(newUser.email).then((result) => {
            return result;
        });
        if (emailResult.length != 0) {
            throw createError('Email already in use', 400);
        } else if (!newUser.email.includes('@')) {
            throw createError('Invalid email address', 400);
        }
    }
    if (newUser.password) {
        try {
            await checkEditPasswords(currentUser, newUser).then((result) => {
                return result;
            });
            newUser.password = await bcrypt
                .hash(newUser.password, 10)
                .then((result) => {
                    return result;
                });
            delete newUser['currentPassword'];
        } catch (err) {
            throw err;
        }
    }
    currentUser = Object.assign(currentUser, newUser);

    // Save to database
    saveSql =
        "UPDATE user SET email = '" +
        currentUser.email +
        "', first_name = '" +
        currentUser.first_name +
        "', last_name = '" +
        currentUser.last_name +
        "', image_filename = '" +
        currentUser.image_filename +
        "', password = '" +
        currentUser.password +
        "' WHERE id = '" +
        currentUser.id +
        "'";
    db.getPool().query(saveSql);
};

function createError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

async function getEmailQuery(email) {
    const emailQuery = "SELECT * from user where email = '" + email + "'";
    emailResult = await db
        .getPool()
        .query(emailQuery)
        .then((emailResult) => {
            return emailResult[0];
        });
    return emailResult;
}

async function checkEditPasswords(currentUser, newUser) {
    if (currentUser.password == '') {
        throw createError('Password cannot be null', 400);
    }
    if (!newUser.currentPassword) {
        throw createError('Invalid password', 400);
    }
    return await bcrypt
        .compare(newUser.currentPassword, currentUser.password)
        .then((result) => {
            if (!result) {
                throw createError('Invalid password', 400);
            }
        });
}
