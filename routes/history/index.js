'use strict'

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
          enum: ['5', '15', '30', '60', '1D' ,'1W', '1M']
        },
        countback: {
          type: 'number'
        }
      },
      required: ['symbol', 'resolution', 'to']
    }
  }
}

module.exports = async function (fastify, opts) {
  fastify.get('/', curOpts, async function (request, reply) {
    const symbolParts = request.query.symbol.split('.')
    switch (symbolParts[1]){
      case 'XSHG': case 'XSHE':
        return eastmoney.getStockHistoryA(request.query.symbol, request.query.resolution, request.query.from, request.query.to)
      default:
        return {s: 'no_data'}
    }
  })
}
