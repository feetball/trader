const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable server-side features for static export
  distDir: 'dist',
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'app'),
    }
    return config
  }
}

module.exports = nextConfig
