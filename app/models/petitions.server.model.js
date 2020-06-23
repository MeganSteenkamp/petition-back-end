
/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Imports category API routes.
 */

const db = require('../../config/db');

exports.getAll = async function (opts) {
    const connection = await db.getPool().getConnection();
    let q = "SELECT * FROM Petition";
    let values = [];

    if (opts.categoryId) {
        q += " WHERE category_id = ?";
        values.push(opts.categoryId);
    }
    if (opts.authorId) {
        if (q.search('WHERE') == -1) {
            q += " WHERE author_id = ?";
        } else {
            q += " AND author_id = ?";
        }
        values.push(opts.authorId);
    }
    if (opts.q) {
        if (q.search('WHERE') == -1) {
            q += " WHERE title LIKE CONCAT('%', ?, '%')";
        } else {
            q += " AND title LIKE CONCAT('%', ?, '%')";
        }
        values.push(opts.q);
    }
    let [rows, _] = await connection.query(q, values);

    await connection.release();
    return rows;
};

exports.getOne = async function (petitionId) {
    const connection = await db.getPool().getConnection();
    let q = "SELECT * FROM Petition where petition_id = ?";

    let [rows, _] = await connection.query(q, petitionId);

    await connection.release();
    return rows[0];
};

exports.insert = async function (title, description, categoryId, createdDate, closingDate, userId) {
    const connection = await db.getPool().getConnection();
    const q = 'INSERT INTO Petition (title, description, category_id, created_date, closing_date, author_id) VALUES ( ?, ?, ?, ?, ?, ? )';
    const values = [title, description, categoryId, createdDate, closingDate, userId]
    let [result, _] = await connection.query(q, values);

    await connection.release();
    return result.insertId;
}

exports.updateField = async function (petitionId, field, value) {
    let values = [value, petitionId];
    const connection = await db.getPool().getConnection();
    const q = `UPDATE Petition SET ${field} = ? WHERE petition_id = ?`;
    const [result, _] = await connection.query(q, values);

    await connection.release();
    return result;
};

exports.deleteOne = async function (petitionId) {
    const connection = await db.getPool().getConnection();
    const q = `DELETE FROM Petition WHERE petition_id = ?`;
    const [result, _] = await connection.query(q, petitionId);

    await connection.release();
    return result;
};