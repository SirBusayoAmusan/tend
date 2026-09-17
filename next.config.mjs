/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export → drag the generated `out/` folder onto Netlify Drop. Done.
  output: 'export',
  trailingSlash: true,
}

export default nextConfig
