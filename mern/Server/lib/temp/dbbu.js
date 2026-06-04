var mysql = require('mysql');
var db = mysql.createConnection({
    host : 'localhost',
    user : 'nodejs',
    password : 'nodejs',
    database : 'webdb2026'
});

db.connect();
module.exports = db;
