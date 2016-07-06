#!/bin/env node
//  OpenShift sample Nodeself.application
require('rootpath')();
var express = require('express');
var fs      = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var expressJwt = require('express-jwt');
//var config = require('config/config.json');
var config = require('config/config.json');

var io = require('socket.io');

/**
 *  Define the sampleself.application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 3000;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test theself.app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sampleself.app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /* self.app server functions (mainself.app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for theself.application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        // self.createRoutes();
        var app = express();

        // view engine setup
        app.set('views', path.join(__dirname, 'views'));
        // app.set('view engine', 'jade');
        app.set('view engine', 'ejs');

        // uncomment after placing your favicon in /public
       app.use(logger('dev'));
       app.use(bodyParser.json());
       app.use(bodyParser.urlencoded({ extended: false }));
       app.use(cookieParser());
       app.use(express.static(path.join(__dirname, 'app')));
       //app.use(require('stylus').middleware(path.join(__dirname, 'public')));

       app.use(session({ secret: config.secret, resave: false, saveUninitialized: true }));

        // use JWT auth to secure the api
        app.use('/api', expressJwt({ secret: config.secret }).unless({ path: ['/api/users/authenticate', '/api/users/register'] }));

        // routes
        app.use('/login', require('controllers/login.controller'));
        app.use('/register', require('controllers/register.controller'));
        app.use('/app', require('controllers/app.controller'));
        app.use('/api/users', require('controllers/api/users.controller'));

        // make '/app' default route
        app.get('/', function (req, res) {
            return res.redirect('/app');
        });

       // catch 404 and forward to error handler
       app.use(function(req, res, next) {
          var err = new Error('Not Found');
          err.status = 404;
          next(err);
        });

        // error handlers

        // development error handler
        // will print stacktrace
        if (app.get('env') === 'development') {
         app.use(function(err, req, res, next) {
            console.log(err.message);
            console.log(req.originalUrl);
            res.status(err.status || 500);
            res.render('error', {
              message: err.message,
              error: err
            });
          });
        }

        // production error handler
        // no stacktraces leaked to user
       app.use(function(err, req, res, next) {
          res.status(err.status || 500);
          console.log(err.message);
          res.render('error', {
            message: err.message,
            error: {}
          });
        });

        //  Add handlers for theapp (from the routes).
        for (var r in self.routes) {
            app.get(r, self.routes[r]);
        }

        self.app = app;
    };


    /**
     *  Initializes the sampleself.application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sampleself.application).
     */
    self.start = function() {
        //  Start theself.app on the specific interface (and port).
        // self.app.listen(self.port, self.ipaddress, function() {
        //     console.log('%s: Node server started on %s:%d ...',
        //                 Date(Date.now() ), self.ipaddress, self.port);
        // });
        var server = require('http').createServer(self.app);  
        io = io.listen(server);
        require('./sockets/base')(io);
        io.set('log level', 1000);

        // io.on('connection', function(client) {  
        //     console.log('Client connected...');

        //     client.on('join', function(data) {
        //         console.log(data);
        //         client.emit('messages', 'Hello from server');
        //     });
        // });
        server.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sampleself.application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

