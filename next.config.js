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
    SOCKETKEY: process.env.NEXT_PUBLIC_BASE_URL_SOCKET
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
