/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // On the public marketing domain, send the homepage to the landing page.
        source: '/',
        has: [{ type: 'host', value: 'glassestimate.app' }],
        destination: '/landing.html',
        permanent: false,
      },
    ];
  },
};
module.exports = nextConfig;
