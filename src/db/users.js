const pool = require('./pool')
const dotenv = require('dotenv')


module.exports.getUser = async function (body) {
  try {
    const { user_id } = body
    const userCheck = await pool.query('SELECT * FROM tg_users WHERE user_id = $1', [user_id])

    if (userCheck.rows.length > 0) {
      return userCheck.rows[0]
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}


module.exports.createUser = async function (body) {
  try {
    const { user_id, first_name, last_name, username, language_code } = body

    const userCheck = await pool.query('SELECT * FROM tg_users WHERE user_id = $1', [user_id])

    if (userCheck.rows.length > 0) {
      return userCheck.rows[0]
    } else {
      await pool.query(
        'INSERT INTO tg_users (user_id, first_name, last_name, username, language_code) VALUES ($1, $2, $3, $4, $5)',
        [user_id, first_name, last_name, username, language_code]
      )

      const newUser = await pool.query('SELECT * FROM tg_users WHERE user_id = $1', [user_id])
      return newUser.rows[0] || null
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

module.exports.getUserPermissions = async function (body) {
  try {
    const { user_id } = body

    const { rows } = await pool.query(
      `SELECT * 
       FROM subscriptions 
       WHERE user_id = $1 
       ORDER BY end_date DESC 
       LIMIT 1`,
      [user_id]
    )

    if (rows.length === 0) {
      return false
    }

    const subscription = rows[0]
    const endDate = new Date(subscription.end_date)
    if (!endDate) return false

    endDate.setHours(23, 59, 59, 999)
    return endDate >= new Date()

  } catch (error) {
    console.error('Error getting user permissions:', error)
    return false
  }
}