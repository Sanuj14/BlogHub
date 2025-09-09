const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Blog = require('../models/Blog');
const path = require('path');


router.get('/dashboard', auth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

router.get('/api/blogs', auth, async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user.id }).sort({ createdAt: -1 });
        res.json({ blogs });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/api/blogs', auth, async (req, res) => {
    const { title, description, category, content, status } = req.body;

    try {
        console.log('Creating blog in dashboard route with data:', { title, category });
        
        let slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
        
        slug = `${slug}-${Date.now()}`;

        const newBlog = new Blog({
            title,
            slug,
            content: content || description,
            category: category || 'Other',
            status: status || 'draft',
            author: req.user.id
        });

        const blog = await newBlog.save();
        const blogId = blog._id.toString();
        
        console.log('Blog created successfully in dashboard route:', { id: blogId, title });
        
        // Return a consistent response format with both _id and id fields
        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            blog: {
                _id: blogId,
                id: blogId,
                title: blog.title,
                slug: blog.slug,
                content: blog.content,
                category: blog.category,
                status: blog.status,
                author: blog.author,
                createdAt: blog.createdAt
            }
        });
    } catch (err) {
        console.error('Error creating blog in dashboard route:', err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
});


router.put('/api/blogs/:id', auth, async (req, res) => {
    const { title, description } = req.body;

    try {
        let blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        blog = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, description },
            { new: true }
        );

        res.json(blog);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/api/blogs/:id', auth, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Make sure user owns blog
        if (blog.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await blog.remove();
        res.json({ message: 'Blog removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 