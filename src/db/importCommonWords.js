const fs = require("fs")
const path = require("path")
const { Pool } = require("pg")
require("dotenv").config()

const pool = new Pool({
	user: process.env.LANG_DB_USER,
	host: process.env.LANG_DB_HOST,
	database: process.env.LANG_DB_NAME,
	password: process.env.LANG_DB_PASSWORD,
	port: process.env.LANG_DB_PORT,
})

const userFileArg = process.argv[2]

if (!userFileArg) {
	console.error(
		"❌ Error: you must pass path to the words file.\nUsage: node importWords.js /path/to/file"
	)
	process.exit(1)
}

const filePath = path.resolve(userFileArg)

async function importWords() {
	const lines = fs
		.readFileSync(filePath, "utf-8")
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean)

	let baseWord = null
	let forms = []

	for (let i = 0; i < lines.length; i++) {
		const word = lines[i]

		if (!baseWord) {
			baseWord = word
			continue
		}

		if (word.startsWith(baseWord)) {
			forms.push(word)
		} else {
			await saveWord(baseWord, forms)

			baseWord = word
			forms = []
		}
	}

	if (baseWord) {
		await saveWord(baseWord, forms)
	}

	console.log("Import completed!")
	process.exit(0)
}

async function saveWord(word, formsArr) {
	const wordForms = formsArr.length > 0 ? formsArr.join(",") : null

	const query = `
    INSERT INTO en_words (word, word_forms)
    VALUES ($1, $2)
    ON CONFLICT (word)
    DO UPDATE SET word_forms = EXCLUDED.word_forms;
  `

	await pool.query(query, [word, wordForms])

	console.log(`Saved: ${word} → ${wordForms || "no forms"}`)
}

importWords().catch((err) => {
	console.error(err)
	process.exit(1)
})
