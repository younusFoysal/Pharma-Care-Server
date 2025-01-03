import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import { authenticateToken } from '../middleware/auth.js';
import mongoose from "mongoose";

const router = express.Router();

// Get all sales
// router.get('/', authenticateToken, async (req, res) => {
//   try {
//     const sales = await Sale.find()
//       .populate('items.product')
//       .sort({ createdAt: -1 });
//     res.json(sales);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sales = await Sale.find()
        .populate('items.product')
        // .populate('customerId')
        .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Get customer dues
router.get('/customer-dues/:customerId', authenticateToken, async (req, res) => {
  try {
    const sales = await Sale.find({
      customerId: req.params.customerId,
      status: { $in: ['partial', 'pending'] }
    }).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single sale
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('items.product');
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a sale
// router.post('/', authenticateToken, async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//
//   try {
//     const { items, ...saleData } = req.body;
//
//     // Update product stock
//     for (const item of items) {
//       const product = await Product.findById(item.product).session(session);
//       if (!product) {
//         throw new Error(`Product not found: ${item.product}`);
//       }
//       if (product.stock < item.quantity) {
//         throw new Error(`Insufficient stock for product: ${product.name}`);
//       }
//       await Product.findByIdAndUpdate(
//         item.product,
//         { $inc: { stock: -item.quantity } },
//         { session }
//       );
//     }
//
//     // Create sale
//     const sale = new Sale({
//       ...saleData,
//       items,
//       date: new Date()
//     });
//     await sale.save({ session });
//
//     await session.commitTransaction();
//     res.status(201).json(sale);
//   } catch (error) {
//     await session.abortTransaction();
//     res.status(400).json({ message: error.message });
//   } finally {
//     session.endSession();
//   }
// });

router.post('/', authenticateToken, async (req, res) => {
  try {
    // const { items, ...saleData } = req.body;

    const { customerId, customerName, customerPhone, items, total, paidAmount, dueAmount, paymentMethod } = req.body;


    // Generate invoice number
    const count = await Sale.countDocuments();
    const invoiceNumber = `INV${String(count + 1).padStart(6, '0')}`;

    // Update product stock
    // for (const item of items) {
    //   const product = await Product.findById(item.product);
    //   if (!product) {
    //     throw new Error(`Product not found: ${item.product}`);
    //   }
    //   if (product.stock < item.quantity) {
    //     throw new Error(`Insufficient stock for product: ${product.name}`);
    //   }
    //
    //   // Deduct stock
    //   await Product.findByIdAndUpdate(
    //       item.product,
    //       { $inc: { stock: -item.quantity } }
    //   );
    // }

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }
      await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
      );
    }


    // Create sale
    // const sale = new Sale({
    //   ...saleData,
    //   items,
    //   invoiceNumber,
    //   date: new Date()
    // });

    const sale = new Sale({
      customerId,
      customerName,
      customerPhone,
      items,
      total,
      paidAmount,
      dueAmount,
      paymentMethod,
      invoiceNumber,
      status: dueAmount > 0 ? 'partial' : 'paid',
      date: new Date()
    });
    console.log(sale)


    await sale.save();

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});


// Update sale payment
router.patch('/:id/payment', authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paidAmount } = req.body;
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const newPaidAmount = sale.paidAmount + paidAmount;
    const newDueAmount = sale.total - newPaidAmount;
    const status = newDueAmount <= 0 ? 'paid' : 'partial';

    const updatedSale = await Sale.findByIdAndUpdate(
        req.params.id,
        {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status
        },
        { new: true, session }
    );

    await session.commitTransaction();
    res.json(updatedSale);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});



// Get sales statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailySales = await Sale.aggregate([
      {
        $match: {
          date: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlySales = await Sale.aggregate([
      {
        $match: {
          date: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      daily: dailySales[0] || { total: 0, count: 0 },
      monthly: monthlySales[0] || { total: 0, count: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;