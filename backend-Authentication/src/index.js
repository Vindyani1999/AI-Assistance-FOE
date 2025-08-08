const express = require('express');
const authRoutes = require('./routes/auth');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use('/auth', authRoutes);

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Auth server running on port ${PORT}`));
}).catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});