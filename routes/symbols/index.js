'use strict'

const eastmoney = require('../../providers/eastmoney')
const csindex = require('../../providers/csindex')

const curOpts = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string'
        },
      },
      required: ['symbol']
    }
  }
}

const getBasic = async (symbol) => {
  const symbolParts = symbol.split('.')
  switch (symbolParts[1]){
    case 'XSHG': case 'XSHE':
      if (symbolParts.length > 2) {
        return eastmoney.getBasicIndex(symbolParts[0])
      }
      return eastmoney.getBasicA(symbolParts[0], symbolParts[1])
    case 'CSI':
      return csindex.getBasic(symbol)
    default:
      const searchList = await eastmoney.doSearch(symbol)
      if (searchList.length == 0) return {}
      return await getBasic(searchList[0].symbol)
  }
}

module.exports = async function (fastify, opts) {
  fastify.get('/', curOpts, async function (request, reply) {
    return await getBasic(request.query.symbol)
  })
}
