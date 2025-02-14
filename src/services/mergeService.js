const fs = require("fs")
const path = require("path")

const TEMP_CATALOG = process.env.TEMP_CATALOG
const OUTPUT_FILE = path.join(TEMP_CATALOG, "merged.mp3")

module.exports.mergeMP3Files = async function (fileNamesArray) {
  try {
    const files = fileNamesArray
      .filter(file => file.endsWith(".mp3"))
      .map(file => path.join(TEMP_CATALOG, file))

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
  } catch (error) {
    console.error("Merge error:", error)
  }
}