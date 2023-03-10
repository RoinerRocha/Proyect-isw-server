const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user = new Schema({
  name: { type: String },
  description: { type: String }
});
module.exports = {
  "model": mongoose.model('users', user),
  "schema": user
}