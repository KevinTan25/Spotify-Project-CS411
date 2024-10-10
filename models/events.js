const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({

    email: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    startTime: {
        type: String,
    },

    city: {
        type: String,
    },

    venue: {
        type: String,

    },
    url: {
        type: String,
    }


}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema)
module.exports = Event;