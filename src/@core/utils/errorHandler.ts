import { AxiosError } from 'axios'
export type ErrorInformation = {
  message: string
  status: number
}
//===============|| ERROR HANDLER ||=====================//
export const errorHandler = (error: AxiosError): ErrorInformation => {
  const { request, response } = error
  if (response) {
    // const {
    //   message
    // } = error;
    const { status } = response
    const message500 = response.data
    if (status === 500) {
      return {
        // message
        message: message500.toString(),
        status
      }
    } else {
      return {
        // message
        message: response.data[0] === undefined ? response.data : response.data[0],
        status
      }
    }
  } else if (request) {
    //request sent but no response received
    return {
      message: 'server time out',
      status: 503
    }
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      message: `${error}`,
      status: 500
    }
  }
}
