const mongoose = require("mongoose")

const schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    description: {
        type: String,
        required: true
    }
})
const Exercise = mongoose.model('Exercise', schema)

module.exports = Exercise