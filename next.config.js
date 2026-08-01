/** @type {import('next').NextConfig} */
const nextConfig = {
  // Homepage routing (marketing landing vs. app dashboard) is handled in
  // src/middleware.ts so it can depend on whether the visitor is signed in.
  // Previously a host-based redirect here sent glassestimate.app/ to
  // /landing.html for everyone, which bounced logged-in users away from the app.
};
module.exports = nextConfig;
