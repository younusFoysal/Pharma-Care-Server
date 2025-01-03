import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
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
  contactPerson: String,
  taxId: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: String
}, {
  timestamps: true
});

export default mongoose.model('Supplier', supplierSchema);