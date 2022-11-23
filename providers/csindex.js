const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const fns = require('date-fns')
const fnstz = require('date-fns-tz')
const { getJsonByUrlParams, ymdSlashed, transpose } = require("../utils")

const doSearch = async (kw) => {
  const url = "https://www.csindex.com.cn/csindex-home/indexInfo/index-fuzzy-search"
  const params = {
    searchInput: kw,
    pageNum: 1,
    pageSize: 10
  }
  const data = await getJsonByUrlParams(url, params)
  if (data.code != "200") return []

  return data.data?.map(i => ({
    type: "index",
    symbol: i.indexCode + '.CSI',
    full_name: i.indexCode + '.CSI',
    exchange: "中证指数",
    description: i.indexName
  }))
}

const getBasic = async (ticker) => {
  const datas = await doSearch(ticker.split('.')[0])
  if (datas.length == 0) return {}
  return { 
    "name": datas[0].symbol.split('.')[0], 
    "exchange-traded": datas[0].exchange, 
    "exchange-listed": datas[0].exchange, 
    "timezone": "Asia/Shanghai", 
    "minmov": 1, 
    "minmov2": 0, 
    "pointvalue": 1, 
    "session": "0930-1500", 
    "has_intraday": true, 
    "has_seconds": true,
    "has_no_volume": false, 
    "description": datas[0].description, 
    "type": "index", 
    "supported_resolutions": ['15S', '1D'], 
    "seconds_multipliers": [15], 
    "pricescale": 100, 
    "ticker": datas[0].symbol
  }
}

const getDaily = async (ticker, startDate, endDate) => {
  const url = "https://www.csindex.com.cn/csindex-home/perf/index-perf"
  const params = {
    indexCode: ticker.split('.')[0],
    startDate:  fnstz.formatInTimeZone(fns.fromUnixTime(startDate), 'Asia/Shanghai', 'yyyyMMdd'),
    endDate: fnstz.formatInTimeZone(fns.fromUnixTime(endDate), 'Asia/Shanghai', 'yyyyMMdd')
  }
  const data = await getJsonByUrlParams(url, params)
  if (data.code != "200") return []

  const table = transpose(data.data.map(l => {
    const time = fns.getUnixTime(fnstz.utcToZonedTime(ymdSlashed(l.tradeDate) + 'T08:00:00Z', 'Asia/Shanghai'))
    return [time, l.open, l.close, l.high, l.low, l.tradingVol]
  }))

  if (table[1][0] == null) return {
    s: 'ok',
    t: table[0],
    o: table[2],
    c: table[2],
    h: table[2],
    l: table[2],
    v: table[5]
  }
  return {
    s: 'ok',
    t: table[0],
    o: table[1],
    c: table[2],
    h: table[3],
    l: table[4],
    v: table[5]
  }
}

const getInterday = async (ticker, start, end) => {
  const url = "https://www.csindex.com.cn/csindex-home/perf/index-perf-oneday"
  const params = {
    indexCode: ticker.split('.')[0]
  }
  const data = await getJsonByUrlParams(url, params)
  if (data.code != "200") return []

  const table = data.data.intraDayPerfList.map((l, i, a) => {
    const time = fns.getUnixTime(fns.parseISO(l.tradeDate + 'T' + l.tradeTime))
    const open = i == 0 ? data.data.intraDayHeader.openToday : a[i - 1].current
    const [low, high] = [open, l.current].sort()
    return [time, open, l.current, high, low, 0]
  })
  const filteredTable = transpose(table.filter(l => l[0] <= end && l[0] >= start))

  if (filteredTable.length == 0) {
    return {s: 'no_data'}
  }
  return {
    s: 'ok',
    t: filteredTable[0],
    o: filteredTable[1],
    c: filteredTable[2],
    h: filteredTable[3],
    l: filteredTable[4],
    v: filteredTable[5]
  }
}

module.exports = {
  doSearch, getBasic, getDaily, getInterday
}
