const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Post = require("../models/Post");

const { ensureAuth, checkRole } = require("../middleware/authMiddleware");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // relative to project root
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name role")
      .sort({ createdAt: -1 });
    res.render("posts", { posts, messages: res.locals.messages, user: req.session.user });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error fetching posts");
    res.redirect("/");
  }
});

router.get("/create", ensureAuth, checkRole(["author", "admin"]), (req, res) => {
  res.render("create-post", { messages: res.locals.messages });
});

router.post(
  "/create",
  ensureAuth,
  checkRole(["author", "admin"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, content, categories, tags } = req.body;

      const post = new Post({
        title,
        content,
        categories: categories ? categories.split(",").map(s => s.trim()).filter(Boolean) : [],
        tags: tags ? tags.split(",").map(s => s.trim()).filter(Boolean) : [],
        author: req.session.user.id,
        image: req.file ? `/uploads/${req.file.filename}` : null,
      });

      await post.save();
      req.flash("success", "Post created successfully");
      res.redirect("/posts");
    } catch (err) {
      console.error(err);
      req.flash("error", "Error creating post");
      res.redirect("/posts/create");
    }
  }
);

router.get("/edit/:id", ensureAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    if (req.session.user.role !== "admin" && post.author.toString() !== req.session.user.id) {
      req.flash("error", "Not allowed");
      return res.redirect("/posts");
    }

    res.render("edit-post", { post, messages: res.locals.messages });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading post");
    res.redirect("/posts");
  }
});

router.post("/edit/:id", ensureAuth, upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    if (req.session.user.role !== "admin" && post.author.toString() !== req.session.user.id) {
      req.flash("error", "Not allowed");
      return res.redirect("/posts");
    }

    post.title = req.body.title;
    post.content = req.body.content;
    post.categories = req.body.categories
      ? req.body.categories.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    post.tags = req.body.tags ? req.body.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
    if (req.file) post.image = `/uploads/${req.file.filename}`;

    await post.save();
    req.flash("success", "Post updated successfully");
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error updating post");
    res.redirect("/posts");
  }
});

router.get("/delete/:id", ensureAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    if (req.session.user.role !== "admin" && post.author.toString() !== req.session.user.id) {
      req.flash("error", "Not allowed");
      return res.redirect("/posts");
    }

    await Post.findByIdAndDelete(req.params.id);
    req.flash("success", "Post deleted successfully");
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error deleting post");
    res.redirect("/posts");
  }
});

module.exports = router;
