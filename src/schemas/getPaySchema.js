module.exports = {
  description: 'Payment Data Schema',
  tags: ['Payment'],
  summary: 'Schema for processing payment data',
  headers: {
    type: 'object',
    properties: {
      Authorization: { type: 'string' },
    },
    required: ['Authorization'],
  },
  body: {
    type: 'object',
    properties: {
      payment_id: { type: 'integer', description: 'Unique ID of the payment' },
      status: { type: 'string', description: 'Status of the payment (e.g., success, failed)' },
      type: { type: 'string', description: 'Type of the payment (e.g., buy, refund)' },
      order_id: { type: 'string', description: 'Order ID associated with the payment' },
      liqpay_order_id: { type: 'string', description: 'LiqPay order ID' },
      description: { type: 'string', description: 'Description of the payment' },
      amount: { type: 'number', description: 'Amount of the payment' },
      currency: { type: 'string', description: 'Currency of the payment (e.g., UAH, USD)' },
      commission_credit: { type: 'number', description: 'Commission charged for the payment' },
      currency_debit: { type: 'string', description: 'Currency of the debit transaction' },
      currency_credit: { type: 'string', description: 'Currency of the credit transaction' },
      create_date: { type: 'integer', description: 'Timestamp of when the payment was created' },
      end_date: { type: 'integer', description: 'Timestamp of when the payment was completed' },
      transaction_id: { type: 'integer', description: 'Transaction ID of the payment' },
      tid: { type: 'string', description: 'Terminal ID for the payment' },
    },
    required: ['payment_id', 'status', 'amount', 'currency', 'create_date', 'end_date'],
  },
  response: {
    201: {
      description: 'Successful response',
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        statusCode: { type: 'integer' },
        error: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['statusCode', 'error', 'message'],
    },
  },
}