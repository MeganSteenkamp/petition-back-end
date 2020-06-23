/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Imports petition photo API routes.
 */

const db = require('../../config/db');

exports.updatePhoto = async function (petitionId, filename) {
    const values = [filename, petitionId];

    const connection = await db.getPool().getConnection();
    const q = 'UPDATE Petition SET photo_filename = ? WHERE petition_id = ?';
    const [result, _] = await connection.query(q, values);

    await connection.release();
    return result;
};