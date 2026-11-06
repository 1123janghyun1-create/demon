from PIL import Image

img = Image.open('logo.png').convert('RGBA')
width, height = img.size

# Make near-white transparent
datas = img.getdata()
newData = []
for item in datas:
    # item is (r, g, b, a)
    if item[0] > 245 and item[1] > 245 and item[2] > 245:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

transparent_img = Image.new("RGBA", img.size)
transparent_img.putdata(newData)
transparent_img.save("logo-transparent.png", "PNG")

# find bounding box of non-transparent pixels
bbox = transparent_img.getbbox()
print("Logo BBox:", bbox)

# Character is on left, text 'demon' is on right. Let's find divider
# BBox is (left, top, right, bottom)
cropped_logo = transparent_img.crop(bbox)
cropped_logo.save("logo-cropped.png", "PNG")

# Let's crop the demon mascot (left part roughly from 0 to around 400)
# Let's inspect column densities
w, h = transparent_img.size
col_counts = [0] * w
for x in range(bbox[0], bbox[2]):
    for y in range(bbox[1], bbox[3]):
        if transparent_img.getpixel((x, y))[3] > 0:
            col_counts[x] += 1

# find gap between mascot and text
for x in range(bbox[0] + 200, bbox[2] - 200):
    if col_counts[x] == 0:
        print(f"Clear gap at x={x}")
        gap_x = x
        break
else:
    # find min column count
    min_x = min(range(bbox[0] + 250, bbox[2] - 300), key=lambda x: col_counts[x])
    print(f"Min column count at x={min_x} (count={col_counts[min_x]})")
    gap_x = min_x

mascot = transparent_img.crop((bbox[0], bbox[1], gap_x, bbox[3]))
mascot_bbox = mascot.getbbox()
mascot = mascot.crop(mascot_bbox)
mascot.save("demon-mascot.png", "PNG")

# create square favicon
max_dim = max(mascot.width, mascot.height)
fav = Image.new("RGBA", (max_dim + 40, max_dim + 40), (255, 255, 255, 0))
fav.paste(mascot, ((fav.width - mascot.width) // 2, (fav.height - mascot.height) // 2))
fav.resize((64, 64), Image.Resampling.LANCZOS).save("favicon.png")
fav.resize((32, 32), Image.Resampling.LANCZOS).save("favicon.ico")

print("Created logo-transparent.png, logo-cropped.png, demon-mascot.png, favicon.png, favicon.ico successfully!")
