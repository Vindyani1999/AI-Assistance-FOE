
const adminMiddleware = (req,res,next) => {
    if(req.userInfo.role !== 'admin'){
        return res.status(401).json({
            success: false,
            message: 'Only Admin can access this page'
        });
    }
    next();
}

module.exports = adminMiddleware;