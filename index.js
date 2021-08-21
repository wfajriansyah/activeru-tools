process.env.NTBA_FIX_319 = 1;
process.env.TZ = 'Asia/Jakarta'

const TelegramBot = require('node-telegram-bot-api');
const io = require('socket.io-client');
const { apikey, token_telegram_bot } = require('./constant');
const socket = io("http://localhost:3000", { 'transports': ['websocket'] });

const fetch = require('node-fetch');
const { logger, sticker } = require('@poppinss/cliui');

const bot = new TelegramBot(token_telegram_bot, {polling: true})

async function getBalance() {
    try {
        const send = await fetch(`https://sms-activate.ru/stubs/handler_api.php?api_key=${apikey}&action=getBalance`, {
            method : "GET",
        })
        const response_send = await send.text()
        if(response_send.indexOf('ACCESS_BALANCE') > -1) {
            const response = response_send.split(":")[1]
            return Promise.resolve(response)   
        } else {
            return Promise.resolve(response_send)
        }
    } catch(err) {
        return Promise.reject(err)
    }
}

async function orderNumber(operator, service) {
    try {
        const send = await fetch(`https://sms-activate.ru/stubs/handler_api.php?api_key=${apikey}&action=getNumber&service=${service}&forward=0&operator=${operator}&ref=&country=6`, {
            method : "GET",
        })
        const response_send = await send.text()
        if(response_send.indexOf('ACCESS_NUMBER') > -1) {
            const order_id = response_send.split(":")[1]
            const number = response_send.split(":")[2]
            return Promise.resolve([order_id, number])   
        } else {
            return Promise.resolve(response_send)
        }
    } catch(err) {
        return Promise.reject(err)
    }
}

async function cancelNumber(order_id) {
    try {
        const send = await fetch(`https://sms-activate.ru/stubs/handler_api.php?api_key=${apikey}&action=setStatus&status=8&id=${order_id}&forward=1`, {
            method : "GET",
        })
        const response_send = await send.text()
        if(response_send.indexOf('ACCESS_CANCEL') > -1) {
            return Promise.resolve(true)
        } else {
            return Promise.resolve(false)
        }
    } catch(err) {
        return Promise.reject(err)
    }
}

async function listenNumber(order_id) {
    try {
        const send = await fetch(`https://sms-activate.ru/stubs/handler_api.php?api_key=${apikey}&action=setStatus&status=1&id=${order_id}&forward=1`, {
            method : "GET",
        })
        const response_send = await send.text()
        if(response_send.indexOf('ACCESS_READY') > -1 || response_send.indexOf('ACCESS_RETRY_GET') > -1) {
            return Promise.resolve(true)
        } else {
            return Promise.resolve(false)
        }
    } catch(err) {
        return Promise.reject(err)
    }
}

async function resendOTP(order_id) {
    try {
        const send = await fetch(`https://sms-activate.ru/stubs/handler_api.php?api_key=${apikey}&action=setStatus&status=3&id=${order_id}&forward=1`, {
            method : "GET",
        })
        const response_send = await send.text()
        if(response_send.indexOf('ACCESS_READY') > -1 || response_send.indexOf('ACCESS_RETRY_GET') > -1) {
            return Promise.resolve(true)
        } else {
            return Promise.resolve(false)
        }
    } catch(err) {
        return Promise.reject(err)
    }
}

async function completeOTP(order_id) {
    try {
        const send = await fetch(`https://sms-activate.ru/stubs/handler_api.php?api_key=${apikey}&action=setStatus&status=6&id=${order_id}&forward=1`, {
            method : "GET",
        })
        const response_send = await send.text()
        if(response_send.indexOf('ACCESS_READY') > -1 || response_send.indexOf('ACCESS_RETRY_GET') > -1 || response_send.indexOf('ACCESS_ACTIVATION') > -1) {
            return Promise.resolve(true)
        } else {
            return Promise.resolve(false)
        }
    } catch(err) {
        return Promise.reject(err)
    }
}

sticker()
.add(`Node JS + Telegram BOT SMS API`)
.add(`Server : sms-activate.ru`)
.render()

const getDates = (timezone) => {
    let nDate;
    const obj = {
        timeZone: timezone
    }
    obj.hour = '2-digit';
    obj.minute = '2-digit';
    obj.second = '2-digit';
    obj.hour12 = false;
    nDate = new Date().toLocaleDateString('en-us', obj)
    return nDate;
}

const listService = {
    shopee : "ka",
    other : "ot",
    gojek : "ni",
    discord : "ds"
}

bot.on('message', async (msg) => {
    const chat_id = msg.chat.id
    const chat_message = msg.text
    
    if(chat_message === "/balance") {
        logger.success(`/balance executed !`)
        const myBalance = await getBalance()
        bot.sendMessage(chat_id, `Your balance : *${myBalance}*`, { parse_mode: 'Markdown', disable_web_page_preview: true })
    } else if(chat_message.startsWith('/otp')) {
        const now_time = (new Date(getDates('Asia/Jakarta'))).getHours() + ":" + (new Date(getDates('Asia/Jakarta'))).getMinutes() + ":" + (new Date(getDates('Asia/Jakarta'))).getSeconds()
        logger.success(`/otp executed !`)

        const data_msgs = chat_message.split(" ")
        const operator = data_msgs[1]
        const service = data_msgs[2]

        const order = await orderNumber(operator, listService[service])
        bot.sendMessage(chat_id, `Order success !

- Phone Number : +${order[1]}
- Order ID : ${order[0]}
- Order Date : ${now_time}

Please type, /verify ${order[0]} for listening message. and /cancel ${order[0]} for cancel ( if not correct for sms ).
And dont forget number will expired on 20minutes.`, {parse_mode : "Markdown"})
        socket.emit("newOrderNumber", {chat_id: `${chat_id}`, id: order[0]})
    } else if(chat_message.startsWith('/cancel')) {
        logger.success(`/cancel executed !`)
        const order_id = chat_message.replace('/cancel ', '').toLowerCase()

        const response = await cancelNumber(order_id)
        if(response === true) {
            bot.sendMessage(chat_id, `Order ID : ${order_id} is cancelled.`)
            socket.emit("smsCancel", order_id)
        } else {
            bot.sendMessage(chat_id, `Bot failed to cancel it. Please do it manually !`)
        }
    } else if(chat_message.startsWith('/verify')) {
        logger.success(`/verify executed !`)
        const order_id = chat_message.replace('/verify ', '').toLowerCase()

        const response = await listenNumber(order_id)
        if(response === true) {
            bot.sendMessage(chat_id, `Order ID : ${order_id} changed to listen number. Go send the sms !`)
            socket.emit("smsListen", {chat_id: chat_id, id: order_id})
        } else {
            bot.sendMessage(chat_id, `Bot failed to change to listen number. Go cancel or do it manually !`)
        }
    } else if(chat_message.startsWith('/resend')) {
        logger.success(`/resend executed !`)
        const order_id = chat_message.replace('/resend ', '').toLowerCase()

        const response = await resendOTP(order_id)
        if(response === true) {
            bot.sendMessage(chat_id, `Order ID : ${order_id} changed to resend number. Go send the sms !`)
            socket.emit("smsResend", {chat_id: chat_id, id: order_id})
        } else {
            bot.sendMessage(chat_id, `Bot failed to change to change status number.`)
        }
    } else if(chat_message.startsWith('/done')) {
        logger.success(`/done executed !`)
        const order_id = chat_message.replace('/done ', '').toLowerCase()

        const response = await completeOTP(order_id)
        if(response === true) {
            bot.sendMessage(chat_id, `Order ID : ${order_id} changed to complete.`)
            socket.emit("smsDone", {chat_id: chat_id, id: order_id})
        } else {
            bot.sendMessage(chat_id, `Bot failed to change to change status number.`)
        }
    }
})