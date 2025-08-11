const studentMiddleware = (req, res, next) => {
    if (req.userInfo.role !== 'student') {
        return res.status(401).json({
            success: false,
            message: 'Only Students can access this page'
        });
    }
    next();
};

module.exports = studentMiddleware;