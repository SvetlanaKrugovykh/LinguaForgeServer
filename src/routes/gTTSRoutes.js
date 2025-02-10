const gTTSController = require('../controllers/gTTSController')
const isAuthorizedGuard = require('../guards/isAuthorizedGuard')
const dataExchangeSchema = require('../schemas/dataExchangeSchema')

module.exports = (fastify, _opts, done) => {

  fastify.route({
    method: 'POST',
    url: '/g-tts',
    handler: gTTSController.gTTs,
    // preHandler: [
    //   isAuthorizedGuard
    // ],
    // schema: dataExchangeSchema
  })

  done()
}

