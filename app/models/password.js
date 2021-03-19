const bcrypt = require('bcrypt');

/*
 * Returns a hash of a given password
*/
exports.hash = async function (password) {
    return await bcrypt.hash(password, 10);
}