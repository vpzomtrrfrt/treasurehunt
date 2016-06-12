var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.addColumn("found", "time", {
    type: "datetime",
    notNull: true
  }, callback);
};

exports.down = function(db, callback) {
  db.removeColumn("found", "time", callback);
};
