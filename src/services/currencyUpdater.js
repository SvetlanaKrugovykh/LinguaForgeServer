const axios = require('axios')
const pool = require('../db/pool')
require('dotenv').config()

async function fetchExchangeRate() {
  try {
    const date = new Date()
    const formattedDateForApi = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`
    const formattedDateForDb = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    const apiUrl = `${process.env.EXCHANGE_URL}=${formattedDateForApi}`

    let response

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt}: Fetching exchange rate...`)
        response = await axios.get(apiUrl)
        break
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error.message);
        if (attempt === 3) {
          throw new Error('Failed to fetch exchange rate after 3 attempts.');
        }
      }
    }

    const exchangeRates = response.data.exchangeRate

    const plnRate = exchangeRates.find(rate => rate.currency === 'PLN')
    if (!plnRate || !plnRate.saleRateNB) {
      console.warn('PLN exchange rate not found in API response.')
      return
    }

    const rateToPln = 1 / plnRate.saleRateNB

    await pool.query(
      `INSERT INTO currency_rates (currency, rate_to_pln, date)
       VALUES ($1, $2, $3)
       ON CONFLICT (currency, date) DO UPDATE SET rate_to_pln = $2`,
      ['PLN', rateToPln, formattedDateForDb]
    )

    console.log(`Exchange rate for PLN on ${formattedDateForApi} set to ${rateToPln}.`)
  } catch (error) {
    console.error('Error fetching or saving exchange rate:', error)
  }
}

module.exports = { fetchExchangeRate }