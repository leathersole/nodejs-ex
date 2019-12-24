//  OpenShift sample Node application
var express = require('express'),
  app = express(),
  morgan = require('morgan'),
  fs = require('fs');

// swagger definitions ---------------
var swaggerJSDoc = require('swagger-jsdoc');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
var options = {
  swaggerDefinition: {
    info: {
      title: 'Hello World',
      version: '1.0.0.'
    },
  },
  apis: ['./server.js'],
};

var swaggerSpec = swaggerJSDoc(options);

// swagger definitions ---------------

Object.assign = require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
  ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
  mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
  mongoURLLabel = "";

if (mongoURL == null) {
  var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
  // If using plane old env vars via service discovery
  if (process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
    mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
    mongoUser = process.env[mongoServiceName + '_USER'];

    // If using env vars from secret from service binding  
  } else if (process.env.database_name) {
    mongoDatabase = process.env.database_name;
    mongoPassword = process.env.password;
    mongoUser = process.env.username;
    var mongoUriParts = process.env.uri && process.env.uri.split("//");
    if (mongoUriParts.length == 2) {
      mongoUriParts = mongoUriParts[1].split(":");
      if (mongoUriParts && mongoUriParts.length == 2) {
        mongoHost = mongoUriParts[0];
        mongoPort = mongoUriParts[1];
      }
    }
  }

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
  }
}
var db = null,
  dbDetails = new Object();

var initDb = function (callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function (err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function (err) { });
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ ip: req.ip, date: Date.now() });
    col.count(function (err, count) {
      if (err) {
        console.log('Error running count. Message:\n' + err);
      }
      res.render('index.html', { pageCountMessage: count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage: null });
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function (err) { });
  }
  if (db) {
    db.collection('counts').count(function (err, count) {
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

app.get('/sleep', function (req, res) {
  setTimeout(function () {
    res.send('{sleep: 60s}');
  }, 60000);
});

app.get('/504', function (req, res) {
  res.writeHead(504, { 'Content-Type': 'text/plain' });
  res.end();
});

/**
 * @swagger
 * /user/{userId}:
 *   get:
 *     description: Get specific user data
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user_id
 *         description: UserID to use for login.
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: login
 *         examples:
 *           user:
 *              user_id: 334857
 *              user_name: Naruki Miyachi
 */

app.get('/user/:userId', function (req, res) {
  res.json({ "user_id": 334857, "user_name": "Naruki Miyachi" });
});

app.get('/api-docs.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/swagger.json', function (req, res) {
  fs.readFile('api/swagger.json', 'utf-8', function (error, data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(data);
    res.end();
  });
});

// error handling
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function (err) {
  console.log('Error connecting to Mongo. Message:\n' + err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
