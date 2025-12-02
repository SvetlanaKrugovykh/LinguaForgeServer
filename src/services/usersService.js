const db = require('../db/requests')

module.exports.saveUserSet = async function (body) {
  const result = await db.saveUserSet(body)
  if (!result || result.length === 0) return null

  return result
}

module.exports.getUserSet = async function (body) {
  const result = await db.getUserSet(body)
  if (!result || result.length === 0) return null

  return result
}