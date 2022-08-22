'use strict'

const eastmoney = require('../../providers/eastmoney')

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
    if (request.query.query == '') return []
    return eastmoney.doSearch(request.query.query)
  })
}
