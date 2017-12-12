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
    const ltc_fps = new FuturesPublicStream(constant.WS_URL_OKEX_FUTURES_API, "ltc")
    update(() => {
        console.log(btc_fps.ctx)
        console.log(ltc_fps.ctx)
    }, 1000)
}

main()
