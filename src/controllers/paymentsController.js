const subscriptions = require('../db/subscriptions')

module.exports.getExchRate = async function (request, reply) {
  try {
    const dataArray = await subscriptions.getExchangeRate(request, reply)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.setExchRate = async function (request, reply) {
  try {
    const dataArray = await subscriptions.setExchangeRate(request, reply)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.getPay = async function (request, reply) {
  try {
    const dataArray = await subscriptions.getPay_(request, reply)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}
