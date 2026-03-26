# Campus Background Image

## How to add your campus image:

1. Save your campus image (the one with the dome pavilion) as: **`campus-bg.jpg`**

2. Place it in this directory: `frontend/public/images/campus-bg.jpg`

3. The image will automatically appear as the background for login/signup pages with:
   - Blur effect (8px)
   - 85% opacity
   - Blue-teal gradient overlay
   - Beautiful frosted glass effect on login card

## Recommended Image Specifications:
- Format: JPG or PNG
- Resolution: At least 1920x1080px (Full HD)
- File size: Under 500KB for faster loading
- Aspect ratio: 16:9 or wider

## Alternative Image Names:
If you want to use a different filename, update line 18 in:
`frontend/src/pages/Auth.css`

Change: `background-image: url('/images/campus-bg.jpg');`
To: `background-image: url('/images/YOUR_IMAGE_NAME.jpg');`
