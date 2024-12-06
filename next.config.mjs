import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // eslint-disable-next-line
  disable: typeof window === 'undefined' ? process.env.NODE_ENV === 'development' : false
});

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
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true
    };
    return config;
  }
};

export default pwaConfig(nextConfig);
