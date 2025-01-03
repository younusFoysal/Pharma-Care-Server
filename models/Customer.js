import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  healthInfo: {
    allergies: [String],
    conditions: [String],
    medications: [String]
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  insuranceInfo: {
    provider: String,
    policyNumber: String
  }
}, {
  timestamps: true
});

// Index for search optimization
customerSchema.index({ name: 'text', email: 'text', phone: 'text' });

export default mongoose.model('Customer', customerSchema);