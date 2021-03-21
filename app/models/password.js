const bcrypt = require('bcrypt');

/*
 * Returns a hash of a given password
*/
exports.hash = async function (password) {
    return await bcrypt.hash(password, 10);
}

exports.compare = async function (password1, password2) {
    await bcrypt.compare(password1, password2, function (err, result) {
        if (!result) {
            throw createError('Invalid username/password combination', 400);
        }
    });
}