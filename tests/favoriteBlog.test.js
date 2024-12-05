const { test, after, describe, beforeEach } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const supertest = require('supertest');
const app = require('../app.js')
const mongoose = require('mongoose')
const Blog = require('../models/blog.js')
const helper = require('./test_helper.js')
const bcrypt = require('bcrypt')
const User = require('../models/user')

const api = supertest(app);

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

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs
        .map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs');
    assert.strictEqual(response.body.length, helper.initialBlogs.length);
})

test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToView = blogsAtStart[0];

    const resultBlog = await api
        .get(`/api/blogs/${blogToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    assert.deepStrictEqual(resultBlog.body, blogToView);
})

test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs');
    const title = response.body.map(e => e.title);
    assert(title.includes('Harry Potter'));
})

test('a valid blog can be added', async () => {
    const newBlog = {
        title: 'Harry Potter',
        author: "J. Rowling"
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

    const titles = blogsAtEnd.map(n => n.title);
    assert(titles.includes('Harry Potter'));
})

test('a blog without title is not added', async () => {
    const newBlog = { author: "J. Rowling" };
    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
})

test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

    const blogsAtEnd = await helper.blogsInDb();
    const titles = blogsAtEnd.map(e => e.title);
    assert(!titles.includes(blogToDelete.title));

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);
})

test('a blog can be updated', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    const updatedData = {
        title: 'Updated Title',
        author: 'Updated Author'
    };

    const result = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedData)
        .expect(200)
        .expect('Content-Type', /application\/json/);


    assert.strictEqual(result.body.title, updatedData.title);
    assert.strictEqual(result.body.author, updatedData.author);

    const blogsAtEnd = await helper.blogsInDb();
    const updatedBlog = blogsAtEnd.find(blog => blog.id === blogToUpdate.id);
    assert.strictEqual(updatedBlog.title, updatedData.title);
    assert.strictEqual(updatedBlog.author, updatedData.author);
});

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'salainen',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        assert(usernames.includes(newUser.username))
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('expected `username` to be unique'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
})


after(async () => {
    await mongoose.connection.close()
})

