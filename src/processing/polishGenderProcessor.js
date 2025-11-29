const pool = require('../db/pool')

// Polish gender detection by word forms
function detectPolishGender(wordForms) {
  if (!wordForms) return null
  // Masculine: forms like -em, -owi, -owie, -a, -ę, -ami, -ach
  if (/\b(em|owi|owie|a|ę|ami|ach)\b/.test(wordForms)) return 'męski'
  // Feminine: forms like -ą, -i, -ie, -ę, -ami, -ach
  if (/\b(ą|i|ie|ę|ami|ach)\b/.test(wordForms)) return 'żeński'
  // Neuter: forms like -o, -e, -em, -ami, -ach
  if (/\b(o|e|em|ami|ach)\b/.test(wordForms)) return 'nijaki'
  return null
}

async function processPolishGender() {
  const { rows } = await pool.query("SELECT id, word, word_forms, gender, part_of_speech FROM pl_words")
  let total = rows.length
  let updated = 0
  let skipped = 0
  for (const row of rows) {
    if (!row.gender && row.word_forms) {
      if (row.part_of_speech && row.part_of_speech.toLowerCase().includes('czasownik')) {
        await pool.query("UPDATE pl_words SET gender = $1 WHERE id = $2", ['-', row.id])
        updated++
        console.log(`Set gender for verb '${row.word}': -`)
        continue
      }
      const gender = detectPolishGender(row.word_forms)
      if (gender) {
        await pool.query("UPDATE pl_words SET gender = $1 WHERE id = $2", [gender, row.id])
        updated++
        console.log(`Set gender for '${row.word}': ${gender}`)
      } else {
        skipped++
      }
    } else {
      skipped++
    }
  }
  console.log(`Polish gender processing complete. Total: ${total}, Updated: ${updated}, Skipped: ${skipped}`)
}

if (require.main === module) {
  processPolishGender()
}

module.exports = { processPolishGender, detectPolishGender }
