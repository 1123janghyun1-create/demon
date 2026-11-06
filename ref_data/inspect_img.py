from PIL import Image

img = Image.open('logo.png')
print('Size:', img.size)
print('Mode:', img.mode)

# Check corner pixels to determine background
corners = [img.getpixel((0, 0)), img.getpixel((img.width - 1, 0)), img.getpixel((0, img.height - 1)), img.getpixel((img.width - 1, img.height - 1))]
print('Corners:', corners)
