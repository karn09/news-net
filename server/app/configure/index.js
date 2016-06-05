'use strict';
module.exports = function (app) {

    // setValue and getValue are merely alias
    // for app.set and app.get used in the less
    // common way of setting application variables.
    app.setValue = app.set.bind(app);

    app.getValue = function (path) {
        return app.get(path);
    };

    require('./app-variables')(app);
    require('./static-middleware')(app);
    require('./parsing-middleware')(app);

    // Logging middleware, set as application
    // variable inside of server/app/configure/app-variables.js
    app.use(app.getValue('log'));

    require('./authentication')(app);
    app.use('/api/comments', require('../routes/comments'));
    app.use('/api/users', require('../routes/users'));
    app.use('/api/parser', require('../routes/parser'));
    app.use('/api/pages', require('../routes/pages'));
    app.use('/api/categories', require('../routes/categories'));
};