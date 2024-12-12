## claim-rivalz-fragment

# To install on Ubuntu 22.04 VPS:

1. รัน 
```bash
apt update && apt upgrade -y
apt install -y unzip git screen
git clone https://github.com/nuttanont/claim-rivalz-fragment.git
cd claim-rivalz-fragment
cp .env.test  .env
```

2. รัน
```bash
nano .env
```
แก้ privatekey เป็นของเป๋าที่เชื่อมบนระบบ rivalz

3. รัน
```bash
curl -fsSL https://bun.sh/install | bash
source /root/.bashrc
bun install
bun index.ts
```

# ตั้ง auto claim ตามเวลา
1. รัน
```bash
nano /root/claim-rivalz-fragment/startauto.sh
```

2. แปะตามนี้ไปในไฟล์
```bash
#!/bin/sh
while true; do
    bun --env-file=/root/claim-rivalz-fragment/.env  /root/claim-rivalz-fragment/index.ts
    sleep 3600
done
```
กด Ctrl + X, Y , enter

3. รัน
```bash
screen -S claim
sudo chmod +x /root/claim-rivalz-fragment/startauto.sh
/root/claim-rivalz-fragment/startauto.sh
```
Ctrl + A + D ออกมาจากจอ

This project was created using `bun init` in bun v1.1.10. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
