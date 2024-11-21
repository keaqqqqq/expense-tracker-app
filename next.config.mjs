/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [{
        protocol: 'https',
        hostname: 'keaqqqqq.com',
        port: '',
        pathname: '/images/**'
    }],
},
  experimental: {
    serverActions: true,
  },
  domains: [
    'keaqqqqq.com', 
  ],

};

export default nextConfig;
