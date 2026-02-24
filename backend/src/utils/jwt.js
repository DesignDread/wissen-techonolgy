import jwt from 'jsonwebtoken';

export const generateToken = (id, email, role = 'user') => {
  return jwt.sign(
    { userId: id, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
