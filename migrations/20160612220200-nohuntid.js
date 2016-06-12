var dbm = global.dbm || require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.removeColumn("clues", "hunt", callback);
};

exports.down = function(db, callback) {
  db.addColumn("clues", "hunt", {
    type: "string",
    notNull: true
  }, callback);
};
