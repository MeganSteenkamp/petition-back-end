const express = require('express');
const bodyParser = require('body-parser');
const { allowCrossOriginRequestsMiddleware } = require('../app/middleware/cors.middleware');


module.exports = function () {
    // INITIALISE EXPRESS //
    const app = express();
    app.rootUrl = '/api/v1';

    // MIDDLEWARE
    app.use(allowCrossOriginRequestsMiddleware);
    app.use(bodyParser.json());

    app.use(bodyParser.raw({ type: 'text/plain' }));  // for the /executeSql endpoint
    app.use(bodyParser.raw({ type: [ 'image/*' ], limit: '50mb' }));

    // ROUTES
    require('../app/routes/backdoor.routes')(app);
    require('../app/routes/users.server.routes')(app);
    require('../app/routes/petitions.server.routes')(app);

    return app;
};
