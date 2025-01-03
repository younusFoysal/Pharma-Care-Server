import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

const router = express.Router();

// Get sales metrics
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const [sales, topProducts] = await Promise.all([
      Sale.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' }
          }
        }
      ]),
      Sale.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        }
      ])
    ]);

    const salesMetrics = sales[0] || { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 };
    const topSellingProducts = topProducts.map(item => ({
      productId: item._id,
      name: item.product[0]?.name || 'Unknown Product',
      quantity: item.quantity,
      revenue: item.revenue
    }));

    res.json({
      ...salesMetrics,
      topSellingProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get inventory metrics
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const [products, lowStock] = await Promise.all([
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
            outOfStock: {
              $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
            }
          }
        }
      ]),
      Product.countDocuments({
        $expr: { $lte: ['$stock', '$reorderLevel'] }
      })
    ]);

    const metrics = products[0] || { totalProducts: 0, totalValue: 0, outOfStock: 0 };

    res.json({
      ...metrics,
      lowStockProducts: lowStock,
      expiringProducts: 0 // Implement expiry tracking if needed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer metrics
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const [customerMetrics, topCustomers] = await Promise.all([
      Customer.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            new: [{ $match: dateFilter }, { $count: 'count' }],
            active: [
              {
                $lookup: {
                  from: 'sales',
                  localField: '_id',
                  foreignField: 'customerId',
                  as: 'sales'
                }
              },
              {
                $match: {
                  'sales.createdAt': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                  }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]),
      Sale.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$customerName',
            totalPurchases: { $sum: 1 },
            totalSpent: { $sum: '$total' }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 }
      ])
    ]);

    const metrics = customerMetrics[0];
    const topCustomersList = topCustomers.map(customer => ({
      customerId: customer._id,
      name: customer._id,
      totalPurchases: customer.totalPurchases,
      totalSpent: customer.totalSpent
    }));

    res.json({
      totalCustomers: metrics.total[0]?.count || 0,
      newCustomers: metrics.new[0]?.count || 0,
      activeCustomers: metrics.active[0]?.count || 0,
      topCustomers: topCustomersList
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get purchase metrics
router.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const [purchaseMetrics, topSuppliers] = await Promise.all([
      PurchaseOrder.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: 1 },
            totalCost: { $sum: '$totalAmount' },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'ordered'] }, 1, 0]
              }
            }
          }
        }
      ]),
      PurchaseOrder.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$supplier',
            orderCount: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'suppliers',
            localField: '_id',
            foreignField: '_id',
            as: 'supplier'
          }
        }
      ])
    ]);

    const metrics = purchaseMetrics[0] || { totalPurchases: 0, totalCost: 0, pendingOrders: 0 };
    const topSuppliersList = topSuppliers.map(supplier => ({
      supplierId: supplier._id,
      name: supplier.supplier[0]?.name || 'Unknown Supplier',
      orderCount: supplier.orderCount,
      totalAmount: supplier.totalAmount
    }));

    res.json({
      ...metrics,
      topSuppliers: topSuppliersList
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product metrics
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const [products, sales] = await Promise.all([
      Product.find(),
      Sale.find().populate('items.product')
    ]);

    // Calculate product performance metrics
    const productStats = products.map(product => {
      const productSales = sales.reduce((acc, sale) => {
        const saleItem = sale.items.find(item =>
            item.product && item.product._id.toString() === product._id.toString()
        );
        if (saleItem) {
          acc.quantity += saleItem.quantity;
          acc.revenue += saleItem.subtotal;
        }
        return acc;
      }, { quantity: 0, revenue: 0 });

      // Calculate growth (comparing to previous month)
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

      const previousMonthSales = sales
          .filter(sale => new Date(sale.createdAt) >= lastMonth && new Date(sale.createdAt) < currentMonth)
          .reduce((acc, sale) => {
            const saleItem = sale.items.find(item =>
                item.product && item.product._id.toString() === product._id.toString()
            );
            return acc + (saleItem?.subtotal || 0);
          }, 0);

      const growth = previousMonthSales ?
          ((productSales.revenue - previousMonthSales) / previousMonthSales) * 100 :
          0;

      return {
        id: product._id,
        name: product.name,
        sales: productSales.quantity,
        revenue: productSales.revenue,
        growth: Math.round(growth),
        stock: product.stock
      };
    });

    // Calculate category distribution
    const categories = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = {
          name: product.category,
          value: 0,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
        };
      }
      acc[product.category].value += product.stock;
      return acc;
    }, {});

    res.json({
      products: productStats.sort((a, b) => b.revenue - a.revenue),
      categories: Object.values(categories)
    });
  } catch (error) {
    console.error('Error in /products route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;