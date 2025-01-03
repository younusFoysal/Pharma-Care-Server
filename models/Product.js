import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  manufacturer: String,
  expiryDate: Date,
  batchNumber: String,
  reorderLevel: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', productSchema);