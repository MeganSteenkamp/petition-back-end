/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: Imports signature API routes.
 */

const db = require('../../config/db');

exports.getAll = async function (petitionId) {
    const connection = await db.getPool().getConnection();
    const q = "SELECT signatory_id, name, city, country, signed_date FROM Signature JOIN User on signatory_id = user_id WHERE petition_id = ? ORDER BY signed_date ASC";
    const [result, _] = await connection.query(q, petitionId);

    response = [];
    for (r of result) {
        response.push({
            "signatoryId": r.signatory_id,
            "name": r.name,
            "city": r.city,
            "country": r.country,
            "signedDate": r.signed_date
        })
    }

    await connection.release();
    return response;
}

exports.signPetition = async function (userId, petitionId, date) {
    const values = [userId, petitionId, date];
    const connection = await db.getPool().getConnection();
    const q = 'INSERT INTO Signature (signatory_id, petition_id, signed_date) VALUES ( ?, ?, ? )';
    const [result, _] = await connection.query(q, values);

    await connection.release();
    if (result.affectedRows == 0) {
        return false;
    }
    return true;
}

exports.getSignatureCount = async function (petitionId) {
    const connection = await db.getPool().getConnection();
    const q = "SELECT COUNT(signatory_id) from Signature WHERE petition_id = ?"
    let [rows, _] = await connection.query(q, petitionId);

    await connection.release();
    return parseInt(rows[0]['COUNT(signatory_id)']);
};

exports.deleteAllSignatures = async function (petitionId) {
    const connection = await db.getPool().getConnection();

    const q = "DELETE FROM Signature WHERE petition_id = ?"
    const [result, _] = await connection.query(q, petitionId);

    await connection.release();
    return result;
};


exports.removeSignature = async function (petitionId, userId) {
    const connection = await db.getPool().getConnection();
    const values = [petitionId, userId];
    const q = "DELETE FROM Signature WHERE petition_id = ? AND signatory_id = ?"
    const [result, _] = await connection.query(q, values);

    await connection.release();
    if (result.affectedRows == 0) {
        return false;
    }
    return true;
};