const WebSocket = require('ws');
const builder = require('./cmd_builder')

const addChannel = (ws, channel, subscriber) => {
    const event_name = 'addChannel'
    if(subscriber){
        ws.on(channel, subscriber)
    }
    return ws.send(JSON.stringify({
        event : event_name,
        channel : channel,
    }))
}

const initializeStream = (self) => {
    const ws = new WebSocket(self.url);
    ws.on('open', () => {
        self.onConnected()
    });
    ws.on('message', (data) => {
        const msg = JSON.parse(data)
        msg.forEach(v => {
            ws.emit(v.channel, v.data)
        })
    });
    ws.on('close', () => {
        self.onClosed()
    });
    ws.on('error', (e) => {
        ws.close()
    });
    return ws
}

class FuturesPublicStream {
    constructor(url, symbol){
        this.is_reconnect = true
        this.symbol = symbol || "btc"
        this.depth_size = 60
        this.contract_types = [
            "this_week",
            "next_week",
            "quarter"
        ]
        this.url = url
        this.ctx = this.contract_types.reduce((r,v)=>{
            r[v] = {
                ticker : {
                    lastupdate : 0,
                },
                depth : {
                    lastupdate : 0,
                },
                trade : {
                    lastupdate : 0,
                },
                kline_1min : {
                    lastupdate : 0,
                },
            }
            return r
        }, {uptime : 0})
        this.ws = initializeStream(this)
    }
    dispatch(name, contract_type) {
        switch(name){
        case 'ticker':
            return (data) => {
                data.lastupdate = process.uptime()
                this.ctx[contract_type].ticker = data
                this.onUpdated()
            }
        case 'trade':
            return (data) => {
                data.lastupdate = process.uptime()
                this.ctx[contract_type].trade = data
                this.onUpdated()
            }
        case 'depth_full':
            return (data) => {
                data.lastupdate = process.uptime()
                this.ctx[contract_type].depth = data
                this.onUpdated()
            }
        case 'kline_1min':
            return (data) => {
                data.lastupdate = process.uptime()
                this.ctx[contract_type].kline_1min = data
                this.onUpdated()
            }
        }
        // drop data
        return (data) => {
        }
    }
    onConnected() {
        console.log("connected: " + this.url)
        this.contract_types.forEach(contract_type => {
            addChannel( this.ws, builder.ticker("usd", this.symbol, contract_type), this.dispatch( "ticker", contract_type ) )
            addChannel( this.ws, builder.trade("usd", this.symbol, contract_type), this.dispatch( "trade", contract_type ) )
            addChannel( this.ws, builder.depth_full("usd", this.symbol, contract_type, this.depth_size), this.dispatch( "depth_full", contract_type ) )
            addChannel( this.ws, builder.kline("usd", this.symbol, contract_type, "1min"), this.dispatch( "kline_1min", contract_type ) )
            addChannel( this.ws, builder.kline("usd", this.symbol, contract_type, "1hour"), this.dispatch( "kline_1hour", contract_type ) )
        })
    }
    onClosed() {
        console.log("closed")
        this.ws = null
        if(this.is_reconnect){
            this.ws = initializeStream(this)
        }
    }
    onUpdated() {
        this.ctx.uptime = process.uptime()
    }
    close() {
        if(this.ws){
            this.ws.close()
        }
    }
}

module.exports = FuturesPublicStream

