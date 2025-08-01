const express = require('express');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
const cors = require('cors');
app.use(cors(
    {
        origin: 'http://localhost:3000', 
        credentials: true 
    }
));
app.use(express.json());
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Auth server running on port ${PORT}`));