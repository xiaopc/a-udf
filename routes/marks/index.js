'use strict'

const fns = require('date-fns')
const fnstz = require('date-fns-tz')
const eastmoney = require('../../providers/eastmoney')

const curOpts = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string'
        },
        from: {
          type: 'number'
        },
        to: {
          type: 'number'
        },
        resolution: {
          type: 'string',
          enum: ['1D']
        }
      },
      required: ['symbol', 'resolution', 'to']
    }
  }
}

module.exports = async function (fastify, opts) {
  fastify.get('/', curOpts, async function (request, reply) {
    const symbolParts = request.query.symbol.split('.')
    if (request.query.resolution != '1D' || symbolParts.length > 2) return []

    const lhbData = await eastmoney.getLHBDate(symbolParts[0])
    return lhbData?.filter(t => t >= request.query.from && t <= request.query.to)?.map(t => {
      const date = fnstz.formatInTimeZone(fns.fromUnixTime(t), 'Asia/Shanghai', 'yyyy-MM-dd')
      const url = `https://data.eastmoney.com/stock/lhb,${date},${symbolParts[0]}.html`  //  `http://data.10jqka.com.cn/client/index/code/${symbolParts[0]}/date/${date}/nohead`
      return {
        id: `lhb@${url}`,
        color: 'red',
        label: '榜',
        labelFontColor: 'white',
        minSize: 16,
        time: t,
        text: '查看龙虎榜'
      }
    })
  })
}
