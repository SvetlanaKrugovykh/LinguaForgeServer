const gTTSController = require('../controllers/gTTSController')
const isAuthorizedGuard = require('../guards/isAuthorizedGuard')
const dataTTSSchema = require('../schemas/dataTTSSchema')
const coToJestSchema = require('../schemas/coToJestSchema')
const addNewTestOpusSchema = require('../schemas/addNewTestOpusSchema')
const userSetSchema = require('../schemas/userSetSchema')
const userDataMemorizeSchema = require('../schemas/userDataMemorizeSchema')
const getTestOpusSchema = require('../schemas/getTestOpusSchema')

module.exports = (fastify, _opts, done) => {

  fastify.route({
    method: 'POST',
    url: '/g-tts',
    handler: gTTSController.gTTs,
    preHandler: [
      isAuthorizedGuard
    ],
    schema: dataTTSSchema
  })

  fastify.route({
    method: 'POST',
    url: '/co-to-jest',
    handler: gTTSController.coToJest,
    preHandler: [
      isAuthorizedGuard
    ],
    schema: coToJestSchema
  })


  fastify.route({
    method: 'POST',
    url: '/get-test',
    handler: gTTSController.getTest,
    preHandler: [
      isAuthorizedGuard
    ],
    schema: getTestOpusSchema
  })

  fastify.route({
    method: 'POST',
    url: '/get-opus',
    handler: gTTSController.getOpus,
    preHandler: [
      isAuthorizedGuard
    ],
    schema: getTestOpusSchema
  })

  fastify.route({
    method: 'POST',
    url: '/user-set',
    handler: gTTSController.userSettingsSave,
    preHandler: [
      isAuthorizedGuard
    ],
    schema: userSetSchema
  })

  fastify.route({
    method: 'POST',
    url: '/user-data-memorize',
    handler: gTTSController.userDataMemorize,
    preHandler: [
      isAuthorizedGuard
    ],
    schema: userDataMemorizeSchema
  })

  fastify.route({
    method: 'POST',
    url: '/user-opus-save',
    handler: gTTSController.userOpusSave,
    preHandler: [
      isAuthorizedGuard
    ],
    schema: userDataMemorizeSchema
  })

  fastify.route({
    method: 'POST',
    url: '/add-new-test',
    handler: gTTSController.addNewTest,
    preHandler: [
      isAuthorizedGuard
    ],
    schema: addNewTestOpusSchema
  })

  fastify.route({
    method: 'POST',
    url: '/add-new-opus',
    handler: gTTSController.addNewOpus,
    preHandler: [
      isAuthorizedGuard
    ],
    schema: addNewTestOpusSchema
  })
  done()
}

