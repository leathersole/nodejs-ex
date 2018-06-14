//  OpenShift sample Node application
var express = require('express'),
    app     = express();

//app.engine('html', require('ejs').renderFile);
//app.use(morgan('combined'));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.get('/*', function(req, res){
  res.json({
    "method": req.method,
    "baseurl": req.baseurl,
    "params": req.params,
    "path": req.path,
    "method": req.method,
    "query": req.query,
    "hostname": req.hostname,
    "headers": req.headers
    });
});

app.post('/', function(req, res){
  res.json({
    "method": req.method,
    "baseurl": req.baseurl,
    "params": req.params,
    "path": req.path,
    "method": req.method,
    "query": req.query,
    "hostname": req.hostname,
    "headers": req.headers,
    "body": req.body
    });
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
