const mongoose = require("mongoose");
const smsSchema = new mongoose.Schema({
    inbox: {
        type: String,
    },
    chat_id: {
        type: String
    },
    order_id: {
        type: String
    },
    tanggal: {
        type: String
    },
    status: {
        type: String
    }
});

module.exports = mongoose.model("sms-inbox", smsSchema);
  