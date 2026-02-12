/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: false,
  },
  env: {
    CHARSET: 'utf-8',
  },
}

module.exports = nextConfig
