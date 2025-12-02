import { apiGet, apiPost, apiPut } from 'src/hooks/axios'

export const handleAddEvent = (url, bodyParams) => {
  return apiPost(url, bodyParams)
}
export const handleUpdateEvent = (url, bodyParams) => {
  return apiPut(url, bodyParams)
}
export const handleListEvent = (url, bodyParams) => {
  return apiGet(url, bodyParams)
}
