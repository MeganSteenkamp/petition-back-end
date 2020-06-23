const bcrypt = require('bcrypt');
const saltRounds = 3;

exports.hash = async function (rawPassword) {
    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);
    return hashedPassword;
}

exports.compare = async function (rawPassword, encryptedPassword) {
    const match = await bcrypt.compare(rawPassword, encryptedPassword);
    return match;
}