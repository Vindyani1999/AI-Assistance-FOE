const lecturerMiddleware = (req, res, next) => {
    const lecturerRoles = [
        'electrical_lecturer',
        'civil_lecturer',
        'mechanical_lecturer'
    ];
    if (!lecturerRoles.includes(req.userInfo.role)) {
        return res.status(401).json({
            success: false,
            message: 'Only Lecturers can access this page'
        });
    }
    next();
};

module.exports = lecturerMiddleware;