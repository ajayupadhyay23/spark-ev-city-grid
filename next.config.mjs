/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Leaflet images and external resources configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
