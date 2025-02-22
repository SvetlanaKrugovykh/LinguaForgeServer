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

  fastify.route({
    method: 'POST',
    url: '/get-opus',
    handler: gTTSController.getOpus,
    // preHandler: [
    //   isAuthorizedGuard
    // ],
    // schema: dataExchangeSchema
  })

  fastify.route({
    method: 'POST',
    url: '/user-set',
    handler: gTTSController.userSettingsSave,
    // preHandler: [
    //   isAuthorizedGuard
    // ],
    // schema: dataExchangeSchema
  })

  fastify.route({
    method: 'POST',
    url: '/user-data-memorize',
    handler: gTTSController.userDataMemorize,
    // preHandler: [
    //   isAuthorizedGuard
    // ],
    // schema: dataExchangeSchema
  })

  fastify.route({
    method: 'POST',
    url: '/add-new-test',
    handler: gTTSController.addNewTest,
    // preHandler: [
    //   isAuthorizedGuard
    // ],
    // schema: dataExchangeSchema
  })

  done()
}

