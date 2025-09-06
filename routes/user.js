const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Post = require("../models/Post"); 

const { ensureAuth, checkRole } = require("../middleware/authMiddleware");

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // case-insensitive email check
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      req.flash("error", "Email already exists");
      return res.redirect("/register");
    }

    user = new User({
      username,
      email: email.toLowerCase(), // ✅ lowercase
      password,
      role: role || "user",
    });

    await user.save();
    req.flash("success", "User registered successfully. Please login.");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error", "Server error");
    res.redirect("/register");
  }
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/login");
    }

    const isMatch = await user.matchPassword(password); // schema method
    if (!isMatch) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/login");
    }

    // store user in session
    req.session.user = { id: user._id, username: user.username, role: user.role };
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error", "Server error");
    res.redirect("/login");
  }
});

router.get("/dashboard", ensureAuth, async (req, res) => {
  const user = req.session.user;

  if (user.role === "admin") {
    try {
      // fetch all users
      const users = await User.find().select("-password");

      // fetch all posts with author populated
      const posts = await Post.find().populate("author", "username").sort({ createdAt: -1 });

      // render admin dashboard with users and posts
      res.render("dashboard/admin", { user, users, posts });
    } catch (err) {
      console.error(err);
      req.flash("error", "Server error");
      res.redirect("/dashboard");
    }
  } else if (user.role === "author") {
    res.render("dashboard/author", { user,posts: [] });
  } else {
    res.render("dashboard/user", { user });
  }
});
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.redirect("/dashboard");
    res.redirect("/login");
  });
});

module.exports = router;
