/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Imports user photo API routes.
 */

const db = require('../../config/db');

exports.updatePhoto = async function (userId, filename) {
    const values = [filename, userId];

    const connection = await db.getPool().getConnection();
    const q = 'UPDATE User SET photo_filename = ? WHERE user_id = ?';
    const [result, _] = await connection.query(q, values);

    await connection.release();
    return result;
};