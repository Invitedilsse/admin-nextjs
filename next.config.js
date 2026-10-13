/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

/** @type {import('next').NextConfig} */

// Remove this if you're not using Fullcalendar features
const nextConfig = {
  transpilePackages: ['@jitsi/react-sdk']
}

module.exports = nextConfig
module.exports = {
  trailingSlash: true,
  reactStrictMode: false,
  transpilePackages: ['@jitsi/react-sdk'],
  // pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],
  env: {
    // Add your environment variables here
    // API_URL: process.env.API_URL,
    KEY: process.env.NEXT_PUBLIC_API_KEY,
    // Add other environment variables you need
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    SOCKETKEY: process.env.NEXT_PUBLIC_BASE_URL_SOCKET,

    // BLUEWAABA_URL / BLUEWAABA_TOKEN USED TO BE HERE. They are gone, and the
    // token is the reason.
    //
    // Everything in this `env` block is INLINED INTO THE CLIENT BUNDLE at build
    // time — it is not a server secret, it is a string shipped to every browser
    // that loads the portal. The WhatsApp panel's bearer token was in it, so
    // anyone who opened devtools could read it and send messages on the
    // account, which is charged per message.
    //
    // Those calls now go through admin-nodejs at /api/chatwise/*, authorised by
    // the portal's own login, with the panel token held server-side.
    //
    // NEXT_BLUEWAABA_TOKEN should be removed from .env here, and the token it
    // held should be treated as compromised and rotated in ChatWise: it has
    // been served to every browser that has opened this portal.
  },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      transpilePackages: ['@jitsi/react-sdk'],
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }

    return config
  }
}
