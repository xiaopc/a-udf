'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return { 
      "supports_search": true, 
      "supports_group_request": false, 
      "supports_marks": true, 
      "supports_timescale_marks": false, 
      "supports_time": true, 
      "exchanges": [
        { "value": "", "name": "所有市场", "desc": "" }, 
        { "value": "stock_a", "name": "沪深", "desc": "沪深" }, 
        { "value": "csindex", "name": "中证指数", "desc": "中证指数" }
      ], 
      "symbols_types": [
        { "name": "所有类别", "value": "" }, 
        { "name": "股票", "value": "stock" }, 
        { "name": "指数", "value": "index" }
      ], 
      "supported_resolutions": ['5', '15', '30', '60', '1D' ,'1W', '1M']
    }
  })
}
