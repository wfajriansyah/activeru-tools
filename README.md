# Usage
Type ```node listener-sms.js``` and ```node index.js``` ( 2 terminals, you can use ```screen``` for multi terminals )

# Install Instruction
- Clone this repo
- Put your apikey, and telegram bot token ( from Bot Father )
- Set bot only for personal message ( optional )
- ```npm install```
- Run 

# Command in Bot
- ```/otp [operator] [service]``` Ex: ```/otp indosat shopee```

Services List :

| Name        | Type    |
| ----------- |:-------:|
| Discord App | discord |
| Gojek App   | gojek   |
| Shopee App  | shopee  |
| Other App   | other   |

Operators List :

| Type      |
| :-------: |
| indosat   |
| telkomsel |
| axis      |

- ```/balance```

Get your ```sms-active.ru``` balances

- ```/cancel [order_id]```

Change your order_id status to cancel the order

- ```/verify [order_id]```

Change your order_id status to listen message / sms

- ```/resend [order_id]```

Change your order_id status to listen re-send message / sms

- ```/done [order_id]```

Change your order_id status to complete

# Examples command
- ```/otp indosat discord```
- Put the number in your app, and before submit registration. Do this first
- ```/verify 5232xxx``` ( from command /otp will showing order id )
- Order ID will be changed to listen and message will send directly to your messages
- If you want cancel, type ```/cancel 5232xxx```
- If you want done/complete, type ```/done 5232xxx```