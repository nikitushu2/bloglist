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

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    let totalLikes = 0
    if (blogs.length === 0) {
        return 0
    } else {
        blogs.forEach(blog => totalLikes += blog.likes)
        return totalLikes
    }
}

const favoriteBlog = (blogs) => {
    if (blogs.length === 0) {
        return 0
    } else {
        let likes = blogs.map(blog => blog.likes)
        const topLike = Math.max(...likes)
        const found = blogs.find(blog => blog.likes === topLike)
        return { title: found.title, author: found.author, likes: found.likes }
    }
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    initialBlogs
}