
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String },
  image: { type: String }, 
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  categories: [String],
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Post", postSchema);
