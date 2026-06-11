# คู่มือติดตั้ง SSL Certificate บน EasyPanel (Traefik)

## ข้อมูล Infrastructure

| รายการ | ค่า |
|---|---|
| Frontend Server | `192.168.65.53` (EasyPanel) |
| Backend Server | `192.168.65.54` (EasyPanel) |
| Domain | `adaptme.dcce.go.th` |
| SSL Certificate | Wildcard `*.dcce.go.th` (DigiCert / RapidSSL) |
| ไฟล์ cert | `E:\git\Newdice\DCCE\ssl 2569\ssl 2569\` |

---

## ไฟล์ SSL ที่ใช้

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `fullchain.pem` | Certificate (domain cert + intermediate + root รวมกัน) |
| `privkey.pem` | Private Key (ไม่มี password) |

> ⚠️ cert หมดอายุ **1 กันยายน 2569 (31 Aug 2026)**

---

## ขั้นตอนติดตั้ง / ต่ออายุ SSL

### Step 1: Copy cert ขึ้น Frontend Server (.53)

รันจากเครื่อง Windows (PowerShell):
```powershell
scp "E:\git\Newdice\DCCE\ssl 2569\ssl 2569\fullchain.pem" adaptation@192.168.65.53:~/fullchain.pem
scp "E:\git\Newdice\DCCE\ssl 2569\ssl 2569\privkey.pem" adaptation@192.168.65.53:~/privkey.pem
```

### Step 2: SSH เข้า Frontend Server .53

```bash
ssh adaptation@192.168.65.53
```

### Step 3: Copy cert เข้า Traefik directory

```bash
sudo cp ~/fullchain.pem /etc/easypanel/traefik/dcce.crt
sudo cp ~/privkey.pem /etc/easypanel/traefik/dcce.key
sudo chmod 644 /etc/easypanel/traefik/dcce.crt
sudo chmod 600 /etc/easypanel/traefik/dcce.key

# ตรวจสอบ
sudo openssl x509 -in /etc/easypanel/traefik/dcce.crt -noout -subject -dates
```

### Step 4: สร้าง Traefik custom cert config (ทำครั้งแรกเท่านั้น)

```bash
sudo tee /etc/easypanel/traefik/config/custom-cert.yaml << 'EOF'
tls:
  certificates:
    - certFile: /data/dcce.crt
      keyFile: /data/dcce.key
EOF
```

> **หมายเหตุสำคัญ**: อย่าแก้ไฟล์ `main.yaml` โดยตรง เพราะ EasyPanel จะ overwrite ทุกครั้งที่ Save domain settings
> ให้ใช้ไฟล์ `custom-cert.yaml` แทน ซึ่ง EasyPanel จะไม่แตะต้อง

### Step 5: แก้ EasyPanel Domain Settings

1. เปิด EasyPanel Frontend: `http://192.168.65.53:3000`
2. ไปที่ **dcce → dcce-frontend → Domains**
3. คลิกดินสอ (edit) ที่ `https://adaptme.dcce.go.th/`
4. คลิก tab **SSL**
5. **ลบ `letsencrypt` ออก** จาก Certificate Resolver (เว้นว่าง)
6. กด **Save**

### Step 6: ตรวจสอบผล

Traefik จะ reload อัตโนมัติภายใน 2-3 วินาที

```bash
# ทดสอบ cert ที่ serve จริง
echo | openssl s_client -connect adaptme.dcce.go.th:443 -servername adaptme.dcce.go.th 2>/dev/null | openssl x509 -noout -subject -dates
```

เปิด browser → `https://adaptme.dcce.go.th` → ต้องเห็น 🔒 lock สีเขียว

---

## โครงสร้างไฟล์ Traefik บน Server .53

```
/etc/easypanel/traefik/
├── acme.json              # Let's Encrypt certificates (auto-managed)
├── config/
│   ├── main.yaml          # ⚠️ EasyPanel manages this - อย่าแก้ไขเอง
│   └── custom-cert.yaml   # ✅ ไฟล์นี้ safe - EasyPanel ไม่แตะต้อง
├── dcce.crt               # fullchain.pem (wildcard *.dcce.go.th)
├── dcce.key               # privkey.pem
├── default-domain.crt     # EasyPanel default cert
└── default-domain.key     # EasyPanel default key
```

---

## การต่ออายุ SSL (ทุกปี)

เมื่อได้รับ cert ใหม่ ทำ **Step 1-3 ซ้ำ** เท่านั้น:
1. Copy cert ใหม่ขึ้น server
2. `sudo cp ~/fullchain.pem /etc/easypanel/traefik/dcce.crt`
3. `sudo cp ~/privkey.pem /etc/easypanel/traefik/dcce.key`

Traefik จะ reload อัตโนมัติ ไม่ต้องทำ Step 4-5 อีก

---

## Troubleshooting

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| `NET::ERR_CERT_AUTHORITY_INVALID` | `main.yaml` ถูก overwrite, cert หาย | รัน Step 4 ใหม่ (สร้าง `custom-cert.yaml`) |
| ยังแสดง "ไม่ปลอดภัย" หลัง cert ถูกต้อง | Browser cache HSTS | ปิด browser ทั้งหมดแล้วเปิดใหม่ |
| Cert ใน popup ถูกต้องแต่ยัง warning | letsencrypt resolver ยังอยู่ | ทำ Step 5 ลบ letsencrypt ออก |
