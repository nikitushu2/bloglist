const Blog = require('../models/blog.js');
const User = require('../models/user');

const initialBlogs = [
    {
        title: 'Harry Potter',
        author: "J. Rowling",
    },
    {
        title: 'Magagascar',
        author: "C. Robinson",
    },
]

const nonExistingId = async () => {
    const blog = new Blog({ title: 'willremovethissoon' });

    await blog.save();
    await blog.deleteOne();

    return blog._id.toString();
}

const blogsInDb = async () => {
    const blogs = await Blog.find({});
    return blogs.map(blog => ({ title: blog.title, author: blog.author, id: blog._id.toString() }));
}

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
}

module.exports = { initialBlogs, nonExistingId, blogsInDb, usersInDb };