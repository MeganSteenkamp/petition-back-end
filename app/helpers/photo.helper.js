/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: General helper for photos.
 */

const fs = require('mz/fs');
const mime = require('mime-types');

exports.getfileExtension = function (mimeType) {
    return mime.extension(mimeType);
}

exports.getMimeType = function (filename) {
    return mime.contentType(filename);
}

exports.getPhoto = async function (photosDirectory, filename) {
    if (await fs.exists(photosDirectory + filename)) {
        const image = await fs.readFile(photosDirectory + filename);
        const mimeType = mime.contentType(filename);
        return { image, mimeType };
    }
    return null;
}

exports.writePhoto = async function (photosDirectory, filename, imageData) {
    await fs.writeFile((photosDirectory + filename), imageData, 'binary');
    return;
}

exports.deletePhoto = async function (photosDirectory, filename) {
    await fs.unlink(photosDirectory + filename);
    return;
}
