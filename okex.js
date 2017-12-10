const WebSocket = require('ws');
const URL = "wss://real.okex.com:10440/websocket/okexapi"

const _ticker = (symbol, contract) => ["ok_sub_futureusd", symbol, "ticker", contract].join('_')
const _depth = (symbol, contract, size) => ["ok_sub_future", symbol, "depth", contract, size].join('_')
const _addChannel = (channel) => ({
    event:'addChannel',
    channel:channel,
})
const addTicker = (ws, symbol, contract, subscriber) => {
    const w = _addChannel(_ticker(symbol, contract))
    if(subscriber) ws.on(w.channel, subscriber)
    return ws.send(JSON.stringify(w))
}
const addDepth = (ws, symbol, contract, size, subscriber) => {
    const w = _addChannel(_depth(symbol, contract, size))
    if(subscriber) ws.on(w.channel, subscriber)
    return ws.send(JSON.stringify(w))
}


const dispatch = (ws, cmd, data) => {
    ws.emit(cmd, data)
}

const proc = (ws, msg) => {
    msg.forEach(v => {
        dispatch(ws, v.channel, v.data)
    })
}

const main = (url, sec) => {
    const ctx = {
        uptime : 0,
        lasttime : 0,
        this_week : {},
        next_week : {},
        quarter : {},
    }
    const update = (ws, sec) => setTimeout(() => {
        if(!result.update_flag) return;
        ctx.uptime = process.uptime()
        ws.emit("update", ctx)
        update(ws, sec)
    }, sec)
    const ws = new WebSocket(url);
    ws.on('open', () => {
console.log(url)
        addTicker(ws, "btc", "this_week", (data) => {
console.log(data)
            ctx['this_week'].ticker = data
        })
        addTicker(ws, "btc", "next_week", (data) => {
console.log(data)
            ctx['next_week'].ticker = data
        })
        addTicker(ws, "btc", "quarter", (data) => {
console.log(data)
            ctx['quarter'].ticker = data
        })
        addDepth(ws, "btc", "this_week", 20, (data) => {
console.log(data)
            ctx['this_week'].depth = data
        })
        addDepth(ws, "btc", "next_week", 60, (data) => {
console.log(data)
            ctx['next_week'].depth = data
        })
        addDepth(ws, "btc", "quarter", 60, (data) => {
console.log(data)
            ctx['quarter'].depth = data
        })
        update_flag = true 
        update(ws, sec)
    });
    ws.on('message', (data) => {
        ctx.lasttime = process.uptime()
        proc(ws, JSON.parse(data));
    });
    ws.on('close', () => {
        update_flag = false
        ws.emit('stop')
    });
    ws.on('error', (e) => {
        console.log("ws error ----------------")
        console.log(e)
        update_flag = false
        ws.close()
        //ws.emit('stop')
    });

    const result = {
        update_flag : true,
        ws : ws,
    }
    return result
}

module.exports = main
