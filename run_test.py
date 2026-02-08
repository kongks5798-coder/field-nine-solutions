# Run test with API key loaded
import os
import sys

# Load from .env.local
env_path = r"C:\Users\polor\field-nine-dashboard\.env.local"
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key == "OPENAI_API_KEY":
                    os.environ[key] = value
                    print(f"[ENV] {key} loaded")
                    break

# Now run the test
os.chdir(r"C:\Users\polor\field-nine-solutions")
sys.path.insert(0, r"C:\Users\polor\field-nine-solutions")

exec(open("test_agent_simple.py", encoding="utf-8").read())
