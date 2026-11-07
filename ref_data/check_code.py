import re

with open('src/AppContext.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Check for session restore in AppContext
print("has getSession:", "getSession" in code)
print("has onAuthStateChange:", "onAuthStateChange" in code)
