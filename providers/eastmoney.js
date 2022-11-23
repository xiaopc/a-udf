const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const fns = require('date-fns')
const fnstz = require('date-fns-tz')
const NodeCache = require("node-cache")
const { getJsonByUrlParams, transpose } = require("../utils")
const marketBasic = require("./marketBasic.json")

const memCache = new NodeCache({stdTTL: 60, checkperiod: 120});

const convertAshareTicket = (ticker) => {
  if (ticker.startsWith('sh')) return ticker.slice(2) + '.XSHG'
  else if (ticker.startsWith('sz')) return ticker.slice(2) + '.XSHE'
}

const doSearch = async (kw) => {
  const exchangeCode = {"0": "XSHE", "1": "XSHG", "106": "NYSE", "116": "XHKG", "150": "OTCFUND"}
  const url = "http://searchadapter.eastmoney.com/api/suggest/get"
  const params = {
    "input": kw.split('.')[0],
    "type": "14",
    "token": "D43BF722C8E33BDC906FB84D85E326E8",
    "count": "5",
    "markettype": "",
    "mktnum": "",
    "jys": "",
    "classify": "",
    "securitytype": "",
    "status": "",
  }
  const data = await getJsonByUrlParams(url, params)

  const typeCode = {"AStock": "stock", "UsStock": "stock", "Index": "index", "OTCFUND": "fund"}
  return data.QuotationCodeTable.Data?.filter(i => Object.keys(typeCode).includes(i.Classify)).map(i => {
    let symbol = `${i.Code}.${exchangeCode[i.MktNum]}`
    if (typeCode[i.Classify] == "index") {
      symbol += '.MRI'
    }
    return {
      type: typeCode[i.Classify],
      symbol: symbol,
      full_name: symbol,
      exchange: i.SecurityTypeName,
      description: i.Name
    }
  })
}

const getBasicA = async (ticker, exchange) => {
  const exchangeCode = {"XSHE": "SZ", "XSHG": "SH"}
  const data = await (await fetch(`http://emweb.securities.eastmoney.com/CompanySurvey/PageAjax?code=${exchangeCode[exchange]}${ticker}`)).json()
  return { 
    "name": data.jbzl[0].SECURITY_CODE, 
    "exchange-traded": data.jbzl[0].TRADE_MARKET, 
    "exchange-listed": data.jbzl[0].TRADE_MARKET, 
    "timezone": "Asia/Shanghai", 
    "minmov": 1, 
    "minmov2": 0, 
    "pointvalue": 1, 
    "session": "0930-1130,1300-1500", 
    "session_holidays": marketBasic.ashare.session_holidays,
    "has_intraday": true, 
    "has_no_volume": false, 
    "description": data.jbzl[0].SECURITY_NAME_ABBR, 
    "type": "stock", 
    "supported_resolutions": ['5', '15', '30', '60', '1D' ,'1W', '1M'], 
    "intraday_multipliers": ['5', '15', '30', '60'],
    "pricescale": 100, 
    "ticker": `${ticker}.${exchange}`
  }
}

const getBasicIndex = async (ticker) => {
  const datas = (await doSearch(ticker)).filter(i => i.type == "index")
  if (datas.length == 0) return {}
  return { 
    "name": datas[0].symbol, 
    "exchange-traded": datas[0].exchange, 
    "exchange-listed": datas[0].exchange, 
    "timezone": "Asia/Shanghai", 
    "minmov": 1, 
    "minmov2": 0, 
    "pointvalue": 1, 
    "session": "0930-1500", 
    "has_intraday": true, 
    "has_no_volume": false, 
    "description": datas[0].description, 
    "type": "index", 
    "supported_resolutions": ['5', '15', '30', '60', '1D' ,'1W', '1M'], 
    "pricescale": 100, 
    "ticker": datas[0].symbol
  }
}

const simpleGetStockHistoryA = async (ticker, period, startDate, endDate, adjust = "qfq") => {
  const tickerParts = ticker.split('.')

  const exchangeCode = { "XSHE": "0", "XSHG": "1" }
  const adjustCOde = { "qfq": "1", "hfq": "2", "": "0" }
  const periodCode = { "1D": "101", "1W": "102", "1M": "103" }

  const isInterday = Object.keys(periodCode).indexOf(period) < 0
  const url = "http://push2his.eastmoney.com/api/qt/stock/kline/get"
  const params = {
    "fields1": "f1,f2,f3,f4,f5,f6",
    "fields2": "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f116",
    // "ut": "7eea3edcaed734bea9cbfc24409ed989",
    "klt": isInterday ? period : periodCode[period],
    "fqt": adjustCOde[adjust],
    "secid": `${exchangeCode[tickerParts[1]]}.${tickerParts[0]}`,
    "beg": isInterday ? 0 : fnstz.formatInTimeZone(fns.fromUnixTime(startDate), 'Asia/Shanghai', 'yyyyMMdd'),
    "end": isInterday ? 20500000 : fnstz.formatInTimeZone(fns.fromUnixTime(endDate), 'Asia/Shanghai', 'yyyyMMdd'),
  }
  const data = await getJsonByUrlParams(url, params)
  return data.data.klines.map(l => {
    const line = l.split(',')
    const time = fnstz.utcToZonedTime(isInterday ? line[0] : line[0] + 'T00:00:00Z', 'Asia/Shanghai')
    line[0] = fns.getUnixTime(time)
    return line
  })
}

const getStockHistoryA = async (ticker, period, startDate, endDate, adjust = "qfq") => {
  var originalTable = null
  const periodCode = { "1D": "101", "1W": "102", "1M": "103" }
  const isInterday = Object.keys(periodCode).indexOf(period) < 0

  if (isInterday) {
    originalTable = memCache.get(`kline@${ticker}@${period}`)
  }
  if (!originalTable) {
    originalTable = await simpleGetStockHistoryA(ticker, period, startDate, endDate, adjust)
    if (isInterday) {
      memCache.set(`kline@${ticker}@${period}`, originalTable)
    }
  }
  const filtered = isInterday ? originalTable.filter(l => l[0] <= endDate && l[0] >= startDate) : originalTable
  if (filtered.length == 0) {
    if (!isInterday) {
      originalTable = await simpleGetStockHistoryA(ticker, period, 0, endDate, adjust)
    }
    if (originalTable.length > 0) {
      return {s: 'no_data', nextTime: originalTable[originalTable.length - 1][0]}
    }
    return {s: 'no_data'}
  }
  const table = transpose(filtered)
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

const getLHBDate = async (ticker) => {
  const tickerParts = ticker.split('.')
  const url = "https://datacenter-web.eastmoney.com/api/data/v1/get"
  const params = {
      "reportName": "RPT_LHB_BOARDDATE",
      "columns": "SECURITY_CODE,TRADE_DATE,TR_DATE",
      "filter": `(SECURITY_CODE="${tickerParts[0]}")`,
      "pageNumber": "1",
      "pageSize": "500",
      "sortTypes": "-1",
      "sortColumns": "TRADE_DATE",
      "source": "WEB",
      "client": "WEB",
  }
  const data = await getJsonByUrlParams(url, params)
  return data.result.data?.map(i => {
    return fns.getUnixTime(fnstz.utcToZonedTime(`${i.TRADE_DATE.split(' ')[0]}T00:00:00Z`, 'Asia/Shanghai'))
  })
}

const getLHBDetail = async (ticker, date, isBuy=true) => {
  const tickerParts = ticker.split('.')
  const url = "https://datacenter-web.eastmoney.com/api/data/v1/get"
  const params = {
      "reportName": isBuy ? "RPT_BILLBOARD_DAILYDETAILSBUY" : "RPT_BILLBOARD_DAILYDETAILSSELL",
      "columns": "ALL",
      "filter": `(TRADE_DATE='${fnstz.formatInTimeZone(fns.fromUnixTime(date), 'Asia/Shanghai', 'yyyy-MM-dd')}')(SECURITY_CODE="${tickerParts[0]}")`,
      "pageNumber": "1",
      "pageSize": "500",
      "sortTypes": "-1",
      "sortColumns": isBuy ? "BUY" : "SELL",
      "source": "WEB",
      "client": "WEB",
  }
  const data = await getJsonByUrlParams(url, params)
  const list = data.result.data?.map(i => {
    return {
      '营业部': i.OPERATEDEPT_NAME,
      // '上榜原因': i.EXPLANATION,
      '买入金额': i.BUY,
      '买入占成交': i.TOTAL_BUYRIO,
      '卖出金额': i.SELL,
      '卖出占成交': i.TOTAL_SELLRIO,
      '净买入': i.NET,
    }
  })
  return {
    '上榜原因': data.result.data[0].EXPLANATION,
    '列表': list
  }
}

module.exports = {
  doSearch, getBasicA, getBasicIndex, getStockHistoryA, getLHBDate, getLHBDetail
}
