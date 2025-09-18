// server.js
import 'dotenv/config';
import express from 'express';
import weatherRoutes from './routes/weather.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/weather', weatherRoutes);

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler - MUST BE THE LAST ROUTE
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handler - should come after other middleware but before app.listen
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Weather API: http://localhost:${port}/api/weather?lat=12.97&lng=77.59`);
});