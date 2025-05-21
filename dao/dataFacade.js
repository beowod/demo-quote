// Data Facade - chooses DAO implementation
let dao;
try {
  dao = require('./sqliteDao');
} catch (e) {
  dao = require('./memoryDao');
}
module.exports = dao;
