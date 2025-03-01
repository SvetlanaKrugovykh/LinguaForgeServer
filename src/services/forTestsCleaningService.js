const db = require('../db/requests')
const testS = require('./testsService')

module.exports.cleanTestsService = async function () {
  try {
    const maxTestId = await db.getMaxTestId()

    for (let i = 1; i <= maxTestId; i++) {
      const result = await db.getTasks(null, null, null, null, i)
      const checkData = await testS.checkTestQuality(result[0])
      console.log(`Test for task_id${i}:`)
      if (checkData === "!!!TEXT not filled!!!") {
        console.log('!!!TEXT not filled!!!')
        continue
      }
      if (checkData?.differences) {
        console.log('differences', checkData.differences)
        console.log('correct', checkData.correct)
      }
      // console.log(checkData)
    }

  } catch (error) {
    console.error('Error cleaning tests service:', error)
    return null
  }
}