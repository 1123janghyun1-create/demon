import urllib.request, json, time, hashlib

cloud_name = "xi7gmxxu"
api_key = "981957649779935"
api_secret = "-u9xiH4RoJ4yhg1WPf77iV_i3B8"

timestamp = str(int(time.time()))
to_sign = f"timestamp={timestamp}{api_secret}"
signature = hashlib.sha1(to_sign.encode('utf-8')).hexdigest()

print(f"Timestamp: {timestamp}")
print(f"Signature: {signature}")

# Test upload with a small 1x1 png pixel
import base64
small_png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
data = urllib.parse.urlencode({
    'file': small_png,
    'api_key': api_key,
    'timestamp': timestamp,
    'signature': signature
}).encode('utf-8')

req = urllib.request.Request(url, data=data)
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("Upload SUCCESS!")
        print("Secure URL:", result.get("secure_url"))
except Exception as e:
    print("Upload FAILED:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
