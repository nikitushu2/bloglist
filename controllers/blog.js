const blogRouter = require('express').Router();
const Blog = require('../models/blog.js');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');

const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.replace('Bearer ', '')
    }
    return null
}

blogRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
    response.json(blogs);
})

blogRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})

blogRouter.post('/', async (request, response) => {
    const body = request.body

    const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
    if (!decodedToken.id) {
        return response.status(401).json({ error: 'token invalid' })
    }
    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
        title: body.title,
        author: body.author,
        user: user.id
    })

    if (body.title === undefined) {
        return response.status(400).json({ error: 'title missing' })
    }

    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog);


})

blogRouter.put('/:id', (request, response, next) => {
    const { title, author } = request.body

    Blog.findByIdAndUpdate(request.params.id, { title, author }, { new: true, runValidators: true, context: 'query' })
        .then(updatedBlog => {
            response.json(updatedBlog)
        })
        .catch(error => next(error))
})

blogRouter.delete('/:id', async (request, response) => {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

module.exports = blogRouter