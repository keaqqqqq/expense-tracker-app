/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: "firebasestorage.googleapis.com",
      pathname: '**',
  }]
  },
  experimental: {
    serverActions: true,
  },
  domains: [
    'firebasestorage.googleapis.com',  

  ],

};

export default nextConfig;
