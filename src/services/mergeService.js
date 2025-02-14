const fs = require("fs")
const path = require("path")

const TEMP_CATALOG = process.env.TEMP_CATALOG

module.exports.mergeMP3Files = async function (userId, fileNamesArray) {
  try {
    const OUTPUT_FILE = path.join(TEMP_CATALOG, `${userId}.mp3`)
    const files = fileNamesArray.filter(file => file.endsWith(".mp3"))

    if (files.length === 0) {
      console.log("There are no files.")
      return
    }

    const writeStream = fs.createWriteStream(OUTPUT_FILE)

    for (const file of files) {
      const data = fs.readFileSync(file)
      writeStream.write(data)
      fs.unlinkSync(file)
    }

    writeStream.end()
    console.log(`File created: ${OUTPUT_FILE}`)
    return OUTPUT_FILE

  } catch (error) {
    console.error("Merge error:", error)
  }
}