// Validation middleware for signup
module.exports = function validateSignup(req, res, next) {
  const { email, password, role, department, firstname, lastname } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required.' });
  }

  // Helper to capitalize first letter
  const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

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

  // Password length
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  if (role === 'user' || role === 'student') {
    // Extract names from email
    if (!prefix.includes('_')) {
      return res.status(400).json({ message: 'Student email must be in format firstname_lastname@...' });
    }
    const [first, last] = prefix.split('_');
    req.body.firstname = capitalize(first);
    req.body.lastname = last ? last.toUpperCase() : '';
    // Department check
    const allowed = ['electrical', 'mechanical', 'civil'];
    if (!department || !allowed.includes(department.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid or missing department for student.' });
    }
  } else if (role === 'staff member') {
    // Require firstname and lastname
    if (!firstname || !lastname) {
      return res.status(400).json({ message: 'Staff must provide firstname and lastname.' });
    }
    // Department must match domain
    const domainToDept = {
      'cee.ruh.ac.lk': 'civil',
      'mme.ruh.ac.lk': 'mechanical',
      'eie.ruh.ac.lk': 'electrical',
    };
    if (!domainToDept[domain] || domainToDept[domain] !== department.toLowerCase()) {
      return res.status(400).json({ message: 'Staff department does not match email domain.' });
    }
  } else if (role === 'ar') {
    // AR must have ar.ruh.ac.lk domain, admin department, and names
    if (domain !== 'ar.ruh.ac.lk') {
      return res.status(400).json({ message: 'AR email must be in ar.ruh.ac.lk domain.' });
    }
    if (department !== 'admin') {
      return res.status(400).json({ message: 'AR department must be admin.' });
    }
    if (!firstname || !lastname) {
      return res.status(400).json({ message: 'AR must provide firstname and lastname.' });
    }
  } else {
    return res.status(400).json({ message: 'Invalid role.' });
  }
  next();
}
