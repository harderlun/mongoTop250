const mongoose = require('./db')
const Top250Schema = new mongoose.Schema({
  pic: String,
  title: String,
  slogo: String,
  evaluate: String,
  labels: Array,
  rating: String,
  collected: Boolean,
})
const Top250Model = mongoose.model('top250', Top250Schema, 'top250')
module.exports = Top250Model
