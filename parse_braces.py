with open('android-project/app/src/main/java/com/xiaozhi/r1/server/ApiHandler.kt', 'r') as f:
    lines = f.readlines()
level = 0
for i, line in enumerate(lines):
    level += line.count('{')
    level -= line.count('}')
    print(f"{i+1:3} {level:3} {line.strip()[:60]}")
