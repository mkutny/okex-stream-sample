const constant = require('./constant')
const FuturesPublicStream = require('./futures_public')

const update = (f, interval) => {
    setTimeout(() => {
        f()
        update(f, interval)
    }, interval)
}

const main = async () => {
    const btc_fps = new FuturesPublicStream(constant.WS_URL_OKEX_FUTURES_API, "btc")
    update(() => {
//        console.log(btc_fps.ctx)
        btc_fps.close()
        
    }, 5000)
}

main()
