// Validation middleware for signup (updated for title/department logic)
module.exports = function validateSignup(req, res, next) {
  const { email, password, title, department, firstname, lastname } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Email validation
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  // Only allow specific domains
  const allowedDomains = [
    'cee.ruh.ac.lk',
    'mme.ruh.ac.lk',
    'eie.ruh.ac.lk',
    'ar.ruh.ac.lk',
    'engug.ruh.ac.lk'
  ];
  const [prefix, domain] = email.split('@');
  if (!allowedDomains.includes(domain)) {
    return res.status(400).json({ message: 'Email domain not allowed for registration.' });
  }

  // Password requirements (stronger)
  if (password.length < 8 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)) {
    return res.status(400).json({ message: 'Password does not meet requirements.' });
  }

  // engug.ruh.ac.lk: only department required
  if (domain === 'engug.ruh.ac.lk') {
    if (!department) {
      return res.status(400).json({ message: 'Department is required for this domain.' });
    }
  } else {
    // All other domains: require title, firstname, lastname
    if (!title || !firstname || !lastname) {
      return res.status(400).json({ message: 'Title, first name, and last name are required.' });
    }
    const validTitles = ['mr', 'mrs', 'miss', 'prof', 'dr'];
    if (!validTitles.includes(title.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid title.' });
    }
  }
  next();
}
