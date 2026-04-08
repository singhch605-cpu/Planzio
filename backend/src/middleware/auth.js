const admin = require('../utils/firebase').admin;

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log('[DEBUG] decoded token:', { uid: decoded.uid, email: decoded.email });
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticate };
