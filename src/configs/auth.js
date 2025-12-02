export default {
  meEndpoint: '/auth/me',
  loginEndpoint: '/jwt/login',
  registerEndpoint: '/jwt/register',
  storageTokenKeyName: 'idToken',
  onTokenExpiration: 'refreshToken' // logout | refreshToken
}
