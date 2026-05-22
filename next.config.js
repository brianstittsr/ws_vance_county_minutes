/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'axios'],
  },
  async rewrites() {
    return [
      {
        source: '/downloads/:path*',
        destination: '/api/download/:path*',
      },
      {
        source: '/wiki/:path*',
        destination: '/api/wiki-file/:path*',
      },
    ];
  },
}

module.exports = nextConfig
