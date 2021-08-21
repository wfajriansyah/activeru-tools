process.env.NTBA_FIX_319 = 1;

const delay = require('delay');
const fetch = require('node-fetch');
const server = require('http').createServer();
const io = require('socket.io')(server);
const { apikey, token_telegram_bot } = require('./constant');
const TelegramBot = require('node-telegram-bot-api');
const oi = require('socket.io-client')
const sockets = oi("http://localhost:3000", { 'transports': ['websocket'] });
const bot = new TelegramBot(token_telegram_bot)

const { deleteDataInbox, updateDataInbox, insertDataInbox, getDataInbox, getDataInboxByCriteria } = require("./controller")
const { logger } = require('@poppinss/cliui');

io.on('connection', (socket) => {
    logger.info(`A socket connected !`)
    socket.on("smsCancel", async (msg) => {
        logger.info(`[SOCKET] SMS Cancel on Order ID : ${msg}`)
        try {
            await deleteDataInbox(msg)
        } catch(err) {
            console.log(`Caught error on smsCancel : ${err.message}`)
        }
    })
    socket.on("smsListen", async (msg) => {
        logger.info(`[SOCKET] SMS Listen is active for Order ID : ${msg.id}`)
        const chat_id = msg.chat_id
        const id = msg.id
        try {
            await updateDataInbox(chat_id, id, "Listen")
        } catch(err) {
            console.log(`Caught error on smsListen : ${err.message}`)
        }
    })
    socket.on("newOrderNumber", async (msg) => {
        const chat_id = msg.chat_id
        const id = msg.id
        logger.info(`[SOCKET] Order ID added to database. Order ID : ${id}`)
        try {
            await insertDataInbox("", chat_id, id, "05-05-2021", "Pending")
        } catch(err) {
            console.log(`Caught error on newOrderNumber : ${err.message}`)
        }
    })
    socket.on("smsResend", async (msg) => {
        logger.info(`[SOCKET] SMS Resend is active for Order ID : ${msg.id}`)
        const chat_id = msg.chat_id
        const id = msg.id
        try {
            await updateDataInbox(chat_id, id, "Listen")
        } catch(err) {
            console.log(`Caught error on smsResend : ${err.message}`)
        }
    })
    socket.on("smsDone", async (msg) => {
        logger.info(`[SOCKET] SMS Done for Order ID : ${msg.id}`)
        const chat_id = msg.chat_id
        const id = msg.id
        try {
            await updateDataInbox(chat_id, id, "Done")
        } catch(err) {
            console.log(`Caught error on smsDone : ${err.message}`)
        }
    })
    socket.on("smsReceived", async (msg) => {
        logger.info(`[SOCKET] SMS Received for Order ID : ${msg.id}`)
        const chat_id = msg.chat_id
        const code = msg.code
        const order_id = msg.id

        bot.sendMessage(chat_id, `SMS Received ( Order ID : ${order_id} ) !\n\n${code}\n\nTo resend it, please type /resend ${order_id} and /done ${order_id} if complete sending otp.`, { parse_mode : "Markdown"})
    })
});

server.listen(3000)

async function getListenSMS(order_id, key) {
    try {
        const send = await fetch(`https://sms-activate.ru/stubs/handler_api.php?api_key=${key}&action=getStatus&id=${order_id}`, {
            method : "GET",
        })
        const response_send = await send.text()
        return Promise.resolve(response_send)
    } catch(err) {
        return Promise.reject(err)
    }
}

const main = async () => {
    while(true) {
        const getData = await getDataInboxByCriteria({status: "Listen"})
        await Promise.all(getData.map(async(data) => {
            const order_id = data.order_id
            const response = await getListenSMS(order_id, apikey)
            if(response.indexOf("STATUS_OK:") > -1) {
                const code = response.split(":")
                await updateDataInbox(data.chat_id, order_id, "Done", code[1])
                sockets.emit("smsReceived", {code: code[1], chat_id: data.chat_id, id: data.order_id})
            }
        }))
        await delay(5000)
    }    
}

main()