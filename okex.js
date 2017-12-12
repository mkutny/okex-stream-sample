const WebSocket = require('ws');
const builder = require('./cmd_builder')

const URL = "wss://real.okex.com:10440/websocket/okexapi"

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
        ws.emit('stop')
    });
    ws.on('error', (e) => {
        ws.close()
    });
    return ws
}

class OKEXPublicStream {
    constructor(url){
        this.symbol = "btc"
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
        case 'depth_full':
            return (data) => {
                data.lastupdate = process.uptime()
                this.ctx[contract_type].depth = data
                this.onUpdated()
            }
        }
        return (data) => {}
    }
    onConnected() {
        this.contract_types.forEach(contract_type => {
            addChannel( this.ws, builder.ticker("usd", this.symbol, contract_type), this.dispatch( "ticker", contract_type ) )
            addChannel( this.ws, builder.depth_full("usd", this.symbol, contract_type, this.depth_size), this.dispatch( "depth_full", contract_type ) )
        })
    }
    onUpdated() {
        this.ctx.uptime = process.uptime()
    }
}

module.exports = OKEXPublicStream

