const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    sampleFile: {
        type: String,
        required: true
    },
    securtyKey: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    userEmail1: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;