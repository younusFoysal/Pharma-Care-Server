import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unitCost: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'ordered', 'received', 'cancelled'],
    default: 'draft'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  expectedDeliveryDate: Date,
  receivedDate: Date,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate order number before saving
// purchaseOrderSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     const count = await this.constructor.countDocuments();
//     this.orderNumber = `PO${String(count + 1).padStart(6, '0')}`;
//   }
//   next();
// });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);