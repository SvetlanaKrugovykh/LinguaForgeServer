const fs = require("fs")
const path = require("path")

const TEMP_CATALOG = process.env.TEMP_CATALOG
const OUT_CATALOG = process.env.OUT_CATALOG || 'out'
const SILENCE_FILE = process.env.SILENCE_FILE
const TIMEOUT = parseInt(process.env.TIMEOUT || "20000", 10)
const SILENCE_REPEAT = Math.floor(TIMEOUT / 1000)
const REPEAT_EACH = parseInt(process.env.REPEAT_EACH || '2')

module.exports.mergeMP3Files = async function (userId, fileNamesArray, addSilence = false) {
  try {
    const OUTPUT_FILE = path.join(TEMP_CATALOG, `${userId}.mp3`)
    let files

    if (addSilence) {
      files = []
      for (const file of fileNamesArray) {
        if (file.endsWith(".mp3")) {
          for (let j = 0; j < REPEAT_EACH; j++) {
            files.push(file)
            for (let i = 0; i < SILENCE_REPEAT; i++) {
              files.push(path.join(OUT_CATALOG, SILENCE_FILE))
            }
          }
        }
      }
    } else {
        // Fix: filter only string values before using .endsWith to prevent TypeError
        files = fileNamesArray.filter(file => typeof file === 'string' && file.endsWith(".mp3"))
    }

    if (files.length === 0) {
      console.log("There are no files.")
      return
    }

    const writeStream = fs.createWriteStream(OUTPUT_FILE)
    for (const file of files) {
      if (fs.existsSync(file)) {
        const data = fs.readFileSync(file)
        writeStream.write(data)
      } else {
        console.warn(`File not found: ${file}`)
      }
    }
    await new Promise((resolve, reject) => {
      writeStream.end()
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    console.log(`File created: ${OUTPUT_FILE}`)

    const uniqueFiles = [...new Set(files)]
    for (const file of uniqueFiles) {
      if (
        fs.existsSync(file) &&
        path.dirname(file) === path.resolve(TEMP_CATALOG) &&
        !path.basename(file).startsWith("silence") &&
        file !== OUTPUT_FILE
      ) {
        fs.unlinkSync(file)
      }
    }

    return OUTPUT_FILE

  } catch (error) {
    console.error("Merge error:", error)
  }
}