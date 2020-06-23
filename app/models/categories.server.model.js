/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Imports category API routes.
 */

const db = require('../../config/db');

exports.getAll = async function () {
    const connection = await db.getPool().getConnection();
    const [rows, _] = await connection.query('SELECT * FROM Category');

    await connection.release();
    return rows;
};

exports.getCategory = async function (categoryId) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * FROM Category WHERE category_id = ?';
    const [rows, _] = await connection.query(q, categoryId);

    await connection.release();
    return rows[0];
};