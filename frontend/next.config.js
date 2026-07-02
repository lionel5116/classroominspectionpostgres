/** @type {import('next').NextConfig} */
const nextConfig = {
  // Unused: lib/api.ts fetches the backend's absolute URL directly from the
  // browser, so nothing ever requests a relative /api/... path from the
  // Next.js origin that this rewrite would intercept.
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/:path*`,
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
