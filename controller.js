const mongoose = require("mongoose");
const sms_inbox = require('./models/sms_inbox')

mongoose.connect("mongodb://localhost:27017/tele-sms", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
});

const getDataInbox = async () => {
    try {
        const inbox = await sms_inbox.find()
        return inbox
    } catch(err) {
        return err
    }
}

const getDataInboxByCriteria = async (criteria) => {
    try {
        const get = await sms_inbox.find(criteria)
        return get
    } catch(err) {
        return err
    }
}

const insertDataInbox = async (inbox, chat_id, order_id, tanggal, status) => {
    try {
        await sms_inbox.create({ inbox, chat_id, order_id, tanggal, status })
        return true
    } catch(err) {
        return false
    }
}

const updateDataInbox = async (chat_id, order_id, status, inbox) => {
    try {
        const data_inbox = await sms_inbox.findOne({chat_id: chat_id, order_id: order_id})
        data_inbox.status = status
        data_inbox.inbox = inbox
        await data_inbox.save()
    } catch(err) {
        return err
    }
}

const deleteDataInbox = async (order_id) => {
    try {
        const search_inbox = await sms_inbox.findOne({order_id: order_id})
        await search_inbox.remove()
    } catch(err) {
        return err
    }
}

module.exports = {
    deleteDataInbox, updateDataInbox, insertDataInbox, getDataInbox, getDataInboxByCriteria
}