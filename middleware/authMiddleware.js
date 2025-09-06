function ensureAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  req.user = req.session.user; 
  next();
}

function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user || !allowedRoles.includes(req.session.user.role)) {
      return res.status(403).send("Access Denied");
    }
    next();
  };
}

module.exports = { ensureAuth, checkRole };
