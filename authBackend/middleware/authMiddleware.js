const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {

    const bearerToken = req.headers['authorization'];
    

    const token = bearerToken && bearerToken.split(' ')[1];

    if (!token) {
        res.status(401).json({
            success : false,
            message : 'Access denied. No token provided.'
        });

    }

    try {
        const decodedtoken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        //console.log(decodedtoken);
        req.userInfo = decodedtoken;
    }
    catch (error) {
        res.status(401).json({
            success : false,
            message : 'Invalid token.'
        });
    }

    next();
}

module.exports = authMiddleware;
