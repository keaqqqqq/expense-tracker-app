import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // eslint-disable-next-line
  disable: process.env.NODE_ENV === 'development'
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
  },
  async headers() {
    return [
        {
            source: '/firebase-messaging-sw.js',
            headers: [
                {
                    key: 'Service-Worker-Allowed',
                    value: '/'
                },
                {
                    key: 'Cache-Control',
                    value: 'no-cache, no-store, must-revalidate'
                }
            ]
        }
    ];
}
};

export default pwaConfig(nextConfig);
