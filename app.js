const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Blog = require('./models/Blog');
const cors = require('cors');
const multer = require('multer');


dotenv.config();


const app = express();


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/bloghub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

require('./config/passport')(passport);

app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));


app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret: process.env.SESSION_SECRET || 'bloghub_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));


app.use(passport.initialize());
app.use(passport.session());


app.use(flash());


app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const userRoutes = require('./routes/users');
const indexRoutes = require('./routes/index');
const dashboardRoutes = require('./routes/dashboard');

console.log('Routes imported successfully');


app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/blogs', blogRoutes);
app.use('/users', userRoutes);
app.use('/', indexRoutes);
app.use('/dashboard', dashboardRoutes);


app.get('/api/blogs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { status: 'published' };
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get blogs
    const blogs = await Blog.find(query)
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      success: true,
      blogs,
      totalPages,
      currentPage: page
    });
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching blogs',
      error: err.message 
    });
  }
});


app.get('/blogs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blogs.html'));
});

app.get('/blogs/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog-detail.html'));
});

app.get('/create-blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create-blog.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/edit-profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit-profile.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});


app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, 'public', `${page}.html`);
  

  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }
});


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


app.get('/emergency-logout', (req, res) => {
  // Clear session
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });
  }
  

  res.clearCookie('connect.sid');
  

  res.send(`
    <script>
      // Clear any stored tokens or user data
      localStorage.clear();
      sessionStorage.clear();
      
      // Show message
      alert('Successfully logged out. You will be redirected to the login page.');
      
      // Redirect to login
      window.location.href = '/login';
    </script>
  `);
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; 