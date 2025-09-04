const express = require("express");
const router = express.Router();
const { ensureAuth, checkRole } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Post = require("../models/Post");

router.get("/admin", ensureAuth, checkRole(["admin"]), async (req, res) => {
  const users = await User.find().select("-password").lean();
  const posts = await Post.find().populate("author","username").lean();
  res.render("dashboard/admin", { user: req.session.user, users, posts, messages: res.locals.messages });
});

router.get("/author", ensureAuth, checkRole(["author","admin"]), async (req, res) => {
  const myPosts = await Post.find({ author: req.session.user.id }).lean();
  res.render("dashboard/author", { user: req.session.user, posts: myPosts, messages: res.locals.messages });
});

// user dashboard
router.get("/user", ensureAuth, checkRole(["user","author","admin"]), (req, res) => {
  res.render("dashboard/user", { user: req.session.user, messages: res.locals.messages });
});

module.exports = router;
