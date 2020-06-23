/**
 * Author: Megan Steenkamp
 * Date: March 2020
 * Project: SENG365 Assignment I
 * Description: General helper for validating inputs and sorting.
 */

// Validates strings
exports.isValidString = function (s) {
    if (s == undefined || s.length < 1 || (typeof s) != 'string') {
        return false;
    }
    return true;
}

// Validate given email
exports.isValidEmail = function (email) {
    const regex = /\S+@\S+/g;
    if (!(email.match(regex))) {
        return false;
    }
    return true;
}

// Sort a list of objects by a single property
function sortByProperty(property) {
    let sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

// Sort a list of objects by multiple properties
exports.sortByProperties = function () {
    let properties = arguments;
    return function (a, b) {
        let i = 0, result = 0, numberOfProperties = properties.length;
        while (result === 0 && i < numberOfProperties) {
            result = sortByProperty(properties[i])(a, b);
            i++;
        }
        return result;
    }
}

// Generate current local datetime
exports.currentDateTime = function () {
    var today = new Date();
    var datetime = today.getFullYear() + "-"
        + (today.getMonth() + 1).toString().padStart(2, 0) + "-"
        + today.getDate().toString().padStart(2, 0) + " "
        + today.getHours().toString().padStart(2, 0) + ":"
        + today.getMinutes().toString().padStart(2, 0) + ":"
        + today.getSeconds().toString().padStart(2, 0) + "."
        + today.getMilliseconds().toString().padStart(3, 0);
    return datetime;
}

// Validate closing datetime is after current datetime
exports.validateClosingDate = function (open, close) {
    let today = new Date(open);
    let future = new Date(close);

    return today < future;
}