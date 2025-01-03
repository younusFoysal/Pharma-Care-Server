import express from 'express';
import mongoose from 'mongoose';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all purchase orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate('supplier')
      .populate('items.product')
      .populate('createdBy', '-password')
      .sort({ createdAt: -1 });
    res.json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single purchase order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('items.product')
      .populate('createdBy', '-password');
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json(purchaseOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a purchase order
// router.post('/', authenticateToken, async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//
//   try {
//     const purchaseOrder = new PurchaseOrder({
//       ...req.body,
//       createdBy: req.user.id
//     });
//     await purchaseOrder.save({ session });
//
//     // If status is received, update product stock
//     if (req.body.status === 'received') {
//       for (const item of req.body.items) {
//         await Product.findByIdAndUpdate(
//           item.product,
//           { $inc: { stock: item.quantity } },
//           { session }
//         );
//       }
//     }
//
//     await session.commitTransaction();
//     res.status(201).json(purchaseOrder);
//   } catch (error) {
//     await session.abortTransaction();
//     res.status(400).json({ message: error.message });
//   } finally {
//     session.endSession();
//   }
// });

router.post('/', authenticateToken, async (req, res) => {
  try {
    // Generate order number
    const count = await PurchaseOrder.countDocuments();
    const orderNumber = `PO${String(count + 1).padStart(6, '0')}`;

    // Create the purchase order
    const purchaseOrder = new PurchaseOrder({
      ...req.body,
      createdBy: req.user.id,
      orderNumber
    });

    await purchaseOrder.save();

    // If status is 'received', update product stock
    if (req.body.status === 'received') {
      for (const item of req.body.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        // Update product stock
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } }
        );
      }
    }

    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});



// Update a purchase order
// router.put('/:id', authenticateToken, async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//
//   try {
//     const oldPurchaseOrder = await PurchaseOrder.findById(req.params.id);
//     if (!oldPurchaseOrder) {
//       return res.status(404).json({ message: 'Purchase order not found' });
//     }
//
//     // If status is changing to received, update product stock
//     if (oldPurchaseOrder.status !== 'received' && req.body.status === 'received') {
//       for (const item of req.body.items) {
//         await Product.findByIdAndUpdate(
//           item.product,
//           { $inc: { stock: item.quantity } },
//           { session }
//         );
//       }
//     }
//
//     // If status is changing from received, revert stock
//     if (oldPurchaseOrder.status === 'received' && req.body.status !== 'received') {
//       for (const item of oldPurchaseOrder.items) {
//         await Product.findByIdAndUpdate(
//           item.product,
//           { $inc: { stock: -item.quantity } },
//           { session }
//         );
//       }
//     }
//
//     const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, session }
//     )
//       .populate('supplier')
//       .populate('items.product')
//       .populate('createdBy', '-password');
//
//     await session.commitTransaction();
//     res.json(purchaseOrder);
//   } catch (error) {
//     await session.abortTransaction();
//     res.status(400).json({ message: error.message });
//   } finally {
//     session.endSession();
//   }
// });


// Update a purchase order
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const oldPurchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!oldPurchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // If status is changing to 'received', update product stock
    if (oldPurchaseOrder.status !== 'received' && req.body.status === 'received') {
      for (const item of req.body.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        // Increment product stock
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // If status is changing from 'received', revert stock
    if (oldPurchaseOrder.status === 'received' && req.body.status !== 'received') {
      for (const item of oldPurchaseOrder.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        // Decrement product stock
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    // Update purchase order
    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    )
        .populate('supplier')
        .populate('items.product')
        .populate('createdBy', '-password');

    res.json(purchaseOrder);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});



// Delete a purchase order
// router.delete('/:id', authenticateToken, async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//
//   try {
//     const purchaseOrder = await PurchaseOrder.findById(req.params.id);
//     if (!purchaseOrder) {
//       return res.status(404).json({ message: 'Purchase order not found' });
//     }
//
//     // If status is received, revert stock changes
//     if (purchaseOrder.status === 'received') {
//       for (const item of purchaseOrder.items) {
//         await Product.findByIdAndUpdate(
//           item.product,
//           { $inc: { stock: -item.quantity } },
//           { session }
//         );
//       }
//     }
//
//     await PurchaseOrder.findByIdAndDelete(req.params.id, { session });
//     await session.commitTransaction();
//     res.json({ message: 'Purchase order deleted successfully' });
//   } catch (error) {
//     await session.abortTransaction();
//     res.status(500).json({ message: 'Server error' });
//   } finally {
//     session.endSession();
//   }
// });
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // If status is 'received', revert stock changes
    if (purchaseOrder.status === 'received') {
      for (const item of purchaseOrder.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        // Decrement stock to revert changes
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    // Delete the purchase order
    await PurchaseOrder.findByIdAndDelete(req.params.id);

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});



export default router;