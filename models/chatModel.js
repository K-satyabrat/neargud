const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    isGroup: { type: Boolean, default: false },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    groupName: String,
    groupImage: String,
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isBlock:{
        type:Boolean,
        default:false,
    }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;