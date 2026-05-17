import mongoose from 'mongoose';

/**
 * OfficeLocation model
 * Stores the company's office/work location for geolocation-based attendance.
 * Only one document is maintained (updated in place).
 */
const officeLocationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: [true, 'Latitude is required']
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required']
  },
  radius: {
    type: Number,
    default: 100, // meters
    min: 50,
    max: 1000
  },
  locationName: {
    type: String,
    default: 'Company Office',
    trim: true
  },
  setBy: {
    type: String,
    default: 'Admin'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('OfficeLocation', officeLocationSchema);
