const pool = require('./pool')

module.exports.addSubscription = async function (userId, duration, amountPaid, currency) {
  try {
    const { rows: rateRows } = await pool.query(
      'SELECT rate_to_pln FROM currency_rates WHERE currency = $1 AND date = CURRENT_DATE',
      [currency]
    )

    if (rateRows.length === 0) {
      throw new Error(`No exchange rate found for currency ${currency} on the current date.`)
    }

    const rateToPln = rateRows[0].rate_to_pln

    const amountPaidPln = amountPaid / rateToPln

    let endDate
    const startDate = new Date()
    if (duration === '1_day') {
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 1)
    } else if (duration === '1_week') {
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 7)
    } else if (duration === '1_month') {
      endDate = new Date(startDate)
      endDate.setMonth(startDate.getMonth() + 1)
    } else {
      throw new Error('Invalid duration specified.')
    }

    await pool.query(
      `INSERT INTO subscriptions (user_id, start_date, end_date, amount_paid, currency, amount_paid_pln)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, startDate, endDate, amountPaid, currency, amountPaidPln]
    )

    return { success: true, message: 'Subscription added successfully.' }
  } catch (error) {
    console.error('Error adding subscription:', error)
    return { success: false, message: error.message }
  }
}

module.exports.getSubscription = async function (userId) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND end_date > CURRENT_DATE',
      [userId]
    )

    if (rows.length === 0) {
      return { success: false, message: 'No active subscription found.' }
    }

    return { success: true, subscription: rows[0] }
  } catch (error) {
    console.error('Error getting subscription:', error)
    return { success: false, message: error.message }
  }
}


module.exports.setExchangeRate = async function (currency, rateToPln) {
  try {
    const { rowCount } = await pool.query(
      'INSERT INTO currency_rates (currency, rate_to_pln, date) VALUES ($1, $2, CURRENT_DATE) ON CONFLICT (currency, date) DO UPDATE SET rate_to_pln = EXCLUDED.rate_to_pln',
      [currency, rateToPln]
    )

    if (rowCount === 0) {
      throw new Error('Failed to set exchange rate.')
    }

    return { success: true, message: 'Exchange rate set successfully.' }
  } catch (error) {
    console.error('Error setting exchange rate:', error)
    return { success: false, message: error.message }
  }
}

module.exports.getExchangeRate = async function (currency) {
  try {
    const { rows } = await pool.query(
      'SELECT rate_to_pln FROM currency_rates WHERE currency = $1 AND date = CURRENT_DATE',
      [currency]
    )

    if (rows.length === 0) {
      throw new Error(`No exchange rate found for currency ${currency} on the current date.`)
    }

    return { success: true, rateToPln: rows[0].rate_to_pln }
  } catch (error) {
    console.error('Error getting exchange rate:', error)
    return { success: false, message: error.message }
  }
}
