const cron = require('node-cron')
const { fetchExchangeRate } = require('./currencyUpdater')

cron.schedule('0 10 * * *', async () => {
  console.log('Fetching exchange rate for PLN...')
  await fetchExchangeRate()
})

console.log('Currency updater scheduled to run daily at 10:00.')