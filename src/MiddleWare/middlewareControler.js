const jwt = require('jsonwebtoken')
const { UnauthorizedError, ForbiddenError } = require('../core/error.response')

const middlewareControler = {
  verifyToken: (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      throw new ForbiddenError("Invalid token")
      // return res.status(403).json({ message: "Invalid token" });
    }

    const accessToken = token.split(" ")[1]
    jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, decoded) => {
      if (err) {
        throw new UnauthorizedError('Token expired')
        // return res.status(401).json({ message: 'Token expired' });
      }
      console.log(decoded);
      req.user = decoded;
      next();
    });
  },

  verifyTokenIsAdmin: (req, res, next) => {
    middlewareControler.verifyToken(req, res, () => {
      if (req.user.isAdmin) {
        next()
      } else {
        throw new UnauthorizedError("You're not allowed")
        // res.status(403).json("You're not allowed")
      }
    })
  },

  verifyTokenIsGv: (req, res, next) => {
    middlewareControler.verifyToken(req, res, () => {
      if (req.user.isGV) {
        next()
      } else {
        throw new UnauthorizedError("You're not allowed")
        // res.status(403).json("You're not allowed")
      }
    })
  },

  verifyTokenIsAdminOrGV: (req, res, next) => {
    middlewareControler.verifyToken(req, res, () => {
      if (req.user.isAdmin || req.user.isGV) {
        next();
      } else {
        throw new UnauthorizedError("Access denied")
      }
    });
  }
}

module.exports = middlewareControler