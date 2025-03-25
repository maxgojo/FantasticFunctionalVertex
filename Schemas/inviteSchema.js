const { model, Schema } = require('mongoose');

let inviteSchema = new Schema({
    Guild: String,
    Channel: String,
    Message: String, // Add this line
    Count: Number,
    LastUser: String,
});

module.exports = model('InviteSchema', inviteSchema);