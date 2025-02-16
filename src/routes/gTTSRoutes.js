const gTTSController = require('../controllers/gTTSController')
const isAuthorizedGuard = require('../guards/isAuthorizedGuard')
const dataTTSSchema = require('../schemas/dataTTSSchema')

module.exports = (fastify, _opts, done) => {

  fastify.route({
    method: 'POST',
    url: '/g-tts',
    handler: gTTSController.gTTs,
    // preHandler: [
    //   isAuthorizedGuard
    // ],
    schema: dataTTSSchema
  })

  fastify.route({
    method: 'POST',
    url: '/co-to-jest',
    handler: gTTSController.coToJest,
    // preHandler: [
    //   isAuthorizedGuard
    // ],
    // schema: dataExchangeSchema
  })


  fastify.route({
    method: 'POST',
    url: '/get-test',
    handler: gTTSController.getTest,
    // preHandler: [
    //   isAuthorizedGuard
    // ],
    // schema: dataExchangeSchema
  })

  done()
}

