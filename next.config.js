/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'axios'],
  },
}

module.exports = nextConfig
