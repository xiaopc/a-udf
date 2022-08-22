'use strict'

const fns = require('date-fns')

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return fns.getUnixTime(new Date())
  })
}
