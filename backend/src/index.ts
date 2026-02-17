import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import depositsRoutes from './routes/deposits.js';
import transactionRoutes from './routes/transactions.js';
import systemRoutes from './routes/system.js';
import { validateAPIConfig } from './config/api-config.js';

// Validate API configuration at startup
try {
  validateAPIConfig();
} catch (error) {
  console.error('Failed to start server: Invalid API configuration');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/deposits', depositsRoutes);
app.use('/transactions', transactionRoutes);
app.use('/system', systemRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Aban Remit Core Backend listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
