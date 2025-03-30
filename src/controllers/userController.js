const db = require('../db/users')
module.exports.getUserPermissions = async function (request, reply) {
  const body = request.body

  const user = await db.getUser(body)
  if (!user || user.length === 0) {
    const user = await db.createUser(body)
    if (!user || user.length === 0) return null
  }

  const result = await db.getUserPermissions(body)
  if (!result || result.length === 0) return null

  return result
}

module.exports.getUser = async function (body) {
  const result = await db.getUser(body)
  if (!result || result.length === 0) return null

  return result
}

module.exports.createUser = async function (body) {
  const result = await db.createUser(body)
  if (!result || result.length === 0) return null

  return result
}