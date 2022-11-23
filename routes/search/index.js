'use strict'

const eastmoney = require('../../providers/eastmoney')
const csindex = require('../../providers/csindex')

const curOpts = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        query: {
          type: 'string'
        },
        type: {
          type: 'string'
        },
        exchange: {
          type: 'string'
        },
        limit: {
          type: 'number'
        }
      },
      required: ['query']
    }
  }
}

module.exports = async function (fastify, opts) {
  fastify.get('/', curOpts, async function (request, reply) {
    const sources = [eastmoney, csindex]
    let res = []
    if (request.query.query == '') return res
    for (let s of sources) {
      const data = await s.doSearch(request.query.query)
      res.push(...data)
    }
    return res
  })
}
