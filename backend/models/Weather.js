const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  location: String,
  country: String,
  temp: Number,
  feels_like: Number,
  humidity: Number,
  pressure: Number,
  condition: String,
  description: String,
  icon: String,
  wind_speed: Number,
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  timestamp: Date
});

// Create geospatial index
weatherSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Weather', weatherSchema);