/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Imports user API routes.
 */

const db = require('../../config/db');

exports.insert = async function (name, email, password, city, country) {
    const values = [name, email, password, city, country];

    const connection = await db.getPool().getConnection();
    const q = 'INSERT INTO User (name, email, password, city, country) VALUES ( ?, ?, ?, ?, ? )';
    const [result, _] = await connection.query(q, values);

    response = { "userId": result.insertId };

    await connection.release();
    return response;
};

exports.getUserByEmail = async function (email) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * FROM User WHERE email = ?';
    const [rows, _] = await connection.query(q, email);

    await connection.release();
    return rows[0];
};

exports.userByToken = async function (token) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * from User WHERE auth_token = ?';
    const [rows, _] = await connection.query(q, token);

    await connection.release();
    return rows[0];
}

exports.getAuthToken = async function (userId) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT auth_token from User WHERE user_id = ?';
    const [rows, _] = await connection.query(q, userId);

    await connection.release();
    return rows[0].auth_token;
}

exports.setToken = async function (userId, auth_token) {
    let values = [auth_token, userId];
    const connection = await db.getPool().getConnection();
    const q = 'UPDATE User SET auth_token = ? WHERE user_id = ?';
    const [result, _] = await connection.query(q, values);

    await connection.release();
    return result;
};

exports.logout = async function (token) {
    const connection = await db.getPool().getConnection();
    const q = 'UPDATE User SET auth_token = null WHERE auth_token = ?';
    const [result, _] = await connection.query(q, token);

    await connection.release();
    return;
};

exports.getUser = async function (userId) {
    const connection = await db.getPool().getConnection();
    const q = 'SELECT * from User WHERE user_id = ?';
    const [rows, _] = await connection.query(q, userId);

    await connection.release();
    return rows[0];
};

exports.updateField = async function (userId, field, value) {
    let values = [value, userId];
    const connection = await db.getPool().getConnection();
    const q = `UPDATE User SET ${field} = ? WHERE user_id = ?`;
    const [result, _] = await connection.query(q, values);

    await connection.release();
    if (result.affectedRows == 0) {
        return false;
    }
    return true;
};