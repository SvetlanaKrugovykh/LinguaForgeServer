const gTTsService = require('../services/gTTsService')

module.exports.gTTs = async function (request, reply) {
  try {
    const { queries } = request.body

    const results = await gTTsService.gTTs(queries)
    return reply.send(results)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

