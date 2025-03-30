const pool = require('./pool')

function calculateSubscriptionEndDate(amountPaidPln) {
  const startDate = new Date()
  let subscriptionEndDate = new Date(startDate)

  const monthCost = 150
  const weekCost = 70
  const dayCost = 15

  const months = Math.floor(amountPaidPln / monthCost)
  amountPaidPln -= months * monthCost

  const weeks = Math.floor(amountPaidPln / weekCost)
  amountPaidPln -= weeks * weekCost

  const days = Math.floor(amountPaidPln / dayCost)

  if (months > 0) {
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + months)
  }
  if (weeks > 0) {
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + weeks * 7)
  }
  if (days > 0) {
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + days)
  }

  return subscriptionEndDate
}

function extractUserIdFromDescription(description) {
  try {
    const match = description.match(/Kod płatności:\s*PL_B1_B2_(\d+)/)
    if (match && match[1]) {
      return match[1]
    } else {
      return null
    }
  } catch (error) {
    console.error('Error extracting user ID from description:', error)
    throw error
  }
}

async function insertPayment({
  user_id,
  payment_id,
  status,
  amount,
  currency,
  commission_credit,
  amount_paid_pln,
  description,
  create_date,
  end_date,
  transaction_id,
  tid
}) {
  try {
    await pool.query(
      `INSERT INTO payments (user_id, payment_id, status, amount, currency, commission_credit, amount_paid_pln, description, create_date, end_date, transaction_id, tid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        user_id,
        payment_id,
        status,
        amount,
        currency,
        commission_credit,
        amount_paid_pln,
        description,
        new Date(create_date),
        new Date(end_date),
        transaction_id,
        tid
      ]
    )
  } catch (error) {
    console.error('Error inserting payment:', error)
    throw error
  }
}

module.exports.addSubscription = async function (paymentData) {
  try {
    const {
      payment_id,
      status,
      amount,
      currency,
      commission_credit,
      description,
      create_date,
      end_date,
      transaction_id,
      tid
    } = paymentData

    if (status !== 'success') {
      throw new Error('Payment status is not successful.')
    }

    const user_id = extractUserIdFromDescription(description)
    if (!user_id) throw new Error('User ID not found in payment description.')

    const currency_ = 'PLN'
    const rateToPln = await module.exports.fetchExchangeRate(currency_, new Date().toISOString().split('T')[0])
    if (!rateToPln) throw new Error(`No exchange rate found for currency ${currency_} on the current date.`)

    const amountPaidPln = (amount - commission_credit) * rateToPln //TODO

    await insertPayment({
      user_id,
      payment_id,
      status,
      amount,
      currency,
      commission_credit,
      amount_paid_pln: amountPaidPln,
      description,
      create_date,
      end_date,
      transaction_id,
      tid
    })


    if (amountPaidPln < 15) throw new Error('Insufficient payment amount for any subscription.')

    const subscriptionEndDate = calculateSubscriptionEndDate(amountPaidPln)
    const startDate = new Date()

    await pool.query(
      `INSERT INTO subscriptions (user_id, start_date, end_date, amount_paid, currency, amount_paid_pln)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user_id, startDate, subscriptionEndDate, amount, currency_, amountPaidPln]
    )

    return { success: true, message: 'Subscription and payment added successfully.' }
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


module.exports.setExchangeRate = async function (request, reply) {
  try {
    const { currency, rate_to_pln, date } = request.body

    await pool.query(
      `INSERT INTO currency_rates (currency, rate_to_pln, date)
       VALUES ($1, $2, $3)
       ON CONFLICT (currency, date) DO UPDATE SET rate_to_pln = $2`,
      [currency, rate_to_pln, date]
    )

    reply.status(201).send({ message: 'Exchange rate set successfully.' })
  } catch (error) {
    console.error('Error setting exchange rate:', error)
    reply.status(500).send({ error: 'Internal server error', message: error.message })
  }
}

module.exports.fetchExchangeRate = async function (currency, date) {
  try {
    const { rows } = await pool.query(
      `SELECT rate_to_pln 
       FROM currency_rates 
       WHERE currency = $1 AND date <= $2 
       ORDER BY date DESC 
       LIMIT 1`,
      [currency, date]
    )

    if (!rows && rows.length > 0) {
      throw new Error(`Exchange rate not found for currency ${currency} on or before ${date}.`)
    }

    return rows[0].rate_to_pln
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    throw error
  }
}


module.exports.getExchangeRate = async (request, reply) => {
  try {
    const { currency, date } = request.body

    const rateToPln = await module.exports.fetchExchangeRate(currency, date)

    reply.status(200).send({ rate_to_pln: rateToPln })
  } catch (error) {
    console.error('Error getting exchange rate:', error)
    reply.status(500).send({ error: 'Internal server error', message: error.message })
  }
}

module.exports.getPay_ = async function (request, reply) {
  try {
    const body = request.body

    const result = await module.exports.addSubscription(body)
    if (result.success) {
      reply.status(200).send({ message: result.message })
    } else {
      reply.status(400).send({ error: 'Subscription failed', message: result.message })
    }
  } catch (error) {
    console.error('Error getting payment:', error)
    reply.status(500).send({ error: 'Internal server error', message: error.message })
  }
}
