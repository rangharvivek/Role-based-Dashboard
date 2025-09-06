const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=>console.log("✅ MongoDB connected"))
.catch(err=>console.log("MongoDB err:", err.message));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// static (serve uploads and public files)
app.use("/uploads", express.static(path.join(__dirname,  "uploads")));

// sessions & flash
app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.messages = {
    success: req.flash("success"),
    error: req.flash("error")
  };
  res.locals.currentUser = req.session.user || null;
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", require("./routes/user"));
const postsRouter = require("./routes/posts");
app.use("/posts", postsRouter);
app.use("/dashboard", require("./routes/dashboard"));

app.get("/", (req, res) => res.redirect("/posts"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`🚀 Server running on http://localhost:${PORT}`));
