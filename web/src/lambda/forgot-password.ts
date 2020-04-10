import { APIGatewayEvent } from 'aws-lambda'
import axios from 'axios'

import {
  headers,
  shopifyConfig,
  SHOPIFY_GRAPHQL_URL
} from './requestConfig'

exports.handler = async (event: APIGatewayEvent): Promise<any> => {
  if (event.httpMethod !== 'POST' || !event.body) {
    return {
      statusCode: 400,
      headers,
      body: ''
    }
  }

  let data: {
    email?: string
  };

  console.log('data', event.body)

  try {
    data = JSON.parse(event.body)
  } catch (error) {
    console.log('JSON parsing error:', error);

    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Bad request body'
      })
    };
  }
  const payload = {
    query: `
      mutation customerRecover($email: String!) {
        customerRecover(email: $email) {
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: {
      email: data.email
    }
  }

  try {
    const customer = await axios({
      url: SHOPIFY_GRAPHQL_URL,
      method: 'POST',
      headers: shopifyConfig,
      data: JSON.stringify(payload)
    })
    const {
      data,
      errors
    } = customer.data
    const { customerRecover } = data
    if (customerRecover && customerRecover.userErrors.length > 0) {
      throw customerRecover.userErrors
    } else if (errors && errors.length > 0) {
      throw errors
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          customerRecover: customerRecover
        })
      }
    }
  } catch (err) {

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err[0].message
      })
    }
  }
}
