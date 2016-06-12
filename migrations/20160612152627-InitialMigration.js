'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  db.createTable("clues", {
    id: {type: "string", primaryKey: true},
    hunt: {type: "string", notNull: true},
    depends: {type: "string"},
    data: {type: "string", notNull: true}
  }, function() {
    db.createTable("found", {
      user: {type: "string", primaryKey: true},
      clue: {type: "string", primaryKey: true}
    }, callback);
  });
};

exports.down = function(db, callback) {
  db.dropTable("found", function() {
    db.dropTable("clues", callback);
  });
};
