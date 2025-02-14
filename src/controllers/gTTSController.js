const gTTsService = require('../services/gTTsService')
const translationService = require('../services/translateService')
const analizeService = require('../services/analize')

module.exports.gTTs = async function (request, reply) {
  try {
    const { queries } = request.body

    const results = await gTTsService.gTTs(queries)
    return reply.send(results)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.coToJest = async function (request, reply) {
  try {
    const { text } = request.body
    const data = await analizeService.checkText(text)
    if (data?.traslated && data.traslated === true) return reply.send(data)

    const results = await translationService.g_translateText(text, 'pl', 'en')
    return reply.send(results)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}
