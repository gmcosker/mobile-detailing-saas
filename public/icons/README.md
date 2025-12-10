# App Icons

This directory should contain app icons in the following sizes:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Creating Icons

You can create these icons from a single source image (recommended: 512x512px or larger):

1. **Using online tools:**
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
   - https://www.appicon.co/

2. **Using design tools:**
   - Export from Figma/Adobe XD at each size
   - Use ImageMagick: `convert icon-512x512.png -resize 192x192 icon-192x192.png`

3. **Icon requirements:**
   - Square images (same width and height)
   - PNG format
   - Transparent background (optional but recommended)
   - Simple, recognizable design that works at small sizes

## Temporary Solution

For now, you can use a simple colored square or your logo. The PWA will work without icons, but they improve the user experience.

## For Production

Replace these placeholder icons with your actual app icon/logo before going to production.

