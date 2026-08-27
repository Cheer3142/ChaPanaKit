# 🕊️ ChaPanaKit

**ระบบบริหารงานฌาปนกิจสงเคราะห์**

ChaPanaKit เป็น Web Application สำหรับช่วยจัดการงานภายในสมาคมฌาปนกิจสงเคราะห์ ตั้งแต่การจัดการข้อมูลสมาชิก งานทะเบียน การคำนวณและบันทึกรายการทางการเงิน ไปจนถึงการดูรายงานประจำวัน

โปรเจกต์พัฒนาด้วย **React + Vite** และออกแบบ UI ให้ใช้งานง่าย เหมาะสำหรับเจ้าหน้าที่และผู้ดูแลระบบ

## 🌐 Live Demo

[**เปิดใช้งาน ChaPanaKit**](https://cha-pana-kit-tau.vercel.app/)

## ✨ Features

### 📊 Dashboard

* แสดงจำนวนสมาชิกที่ใช้งานอยู่
* แสดงจำนวนสมาชิกที่ลาออกและเสียชีวิต
* สรุปยอดรับเงินประจำวัน
* สรุปยอดจ่ายเงินประจำวัน
* แสดงยอดเงินสดคงเหลือ
* แสดงยอดเงินฝากธนาคาร
* แสดงรายการทางการเงินล่าสุด

### 👥 งานสมาชิก

* เพิ่มสมาชิกใหม่
* แก้ไขข้อมูลสมาชิก
* ค้นหาสมาชิก
* กรองสมาชิกตามสถานะ
* จัดการเลขทะเบียนสมาชิก
* จัดเก็บข้อมูลผู้ประสานงาน
* พิมพ์รายชื่อสมาชิก
* บันทึกประวัติการเปลี่ยนแปลงข้อมูล

### 📋 งานทะเบียน

* จัดการข้อมูลทะเบียนสมาชิก
* จัดการข้อมูลที่เกี่ยวข้องกับการเสียชีวิต
* คำนวณรายการที่เกี่ยวข้องกับสมาชิก
* รองรับการบันทึกและแก้ไขข้อมูล

### 💰 งานการเงิน

* บันทึกรายการรับเงิน
* บันทึกรายการจ่ายเงิน
* รองรับเงินสดและเงินฝากธนาคาร
* ยกเลิกรายการทางการเงิน
* คำนวณยอดเงินคงเหลือ
* แสดงประวัติรายการทางการเงิน

### 📅 รายงาน

* ดูรายการประจำวัน
* สรุปรายการรับ-จ่าย
* ตรวจสอบข้อมูลทางการเงิน
* รองรับการพิมพ์รายงาน

### ⚙️ ระบบผู้ใช้งาน

* Login สำหรับเจ้าหน้าที่
* รองรับผู้ใช้งานหลายระดับ
* Admin สามารถจัดการผู้ใช้งาน
* Admin สามารถแก้ไขการตั้งค่าระบบ
* ตั้งชื่อสมาคม
* ตั้งอัตราค่าสมาชิกรายเดือน
* จัดการบัญชีธนาคาร

## 🛠️ Tech Stack

| Technology   | Usage                    |
| ------------ | ------------------------ |
| React        | Frontend Framework       |
| Vite         | Development & Build Tool |
| JavaScript   | Application Logic        |
| Tailwind CSS | UI Styling               |
| Lucide React | Icons                    |
| Vercel       | Deployment               |

## 📁 Project Structure

```text
ChaPanaKit/
├── my-react-app/
│   ├── ...
│   └── package.json
│
├── App.jsx
├── index.html
├── README.md
└── .gitattributes
```

> โครงสร้างของ repository ปัจจุบันมีทั้ง `App.jsx` และโฟลเดอร์ `my-react-app` โดย `App.jsx` เป็นส่วนหลักของ application logic ในเวอร์ชันปัจจุบัน

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/Cheer3142/ChaPanaKit.git
cd ChaPanaKit
```

### 2. Install Dependencies

หากตัวโปรเจกต์ Vite อยู่ใน `my-react-app`:

```bash
cd my-react-app
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

จากนั้นเปิด URL ที่ Vite แสดงใน Terminal เช่น:

```text
http://localhost:5173
```

### 4. Build for Production

```bash
npm run build
```

ไฟล์สำหรับ Production จะถูกสร้างในโฟลเดอร์:

```text
dist/
```

สามารถทดสอบ Production build ด้วย:

```bash
npm run preview
```

## 🔐 User Roles

ระบบรองรับผู้ใช้งานหลัก 2 ระดับ:

### Administrator

สามารถ:

* ใช้งานทุก Module
* จัดการผู้ใช้งาน
* แก้ไข Settings
* จัดการข้อมูลระบบ

### Staff

สามารถใช้งานฟังก์ชันงานประจำ เช่น:

* Dashboard
* สมาชิก
* งานทะเบียน
* การเงิน
* รายงาน

โดยเมนู Settings จะสงวนไว้สำหรับ Administrator

## 💾 Data Storage

ในเวอร์ชันปัจจุบัน ระบบใช้ `window.storage` สำหรับจัดเก็บข้อมูลของ application โดยมีข้อมูลหลัก ได้แก่:

```text
users
members
coordinators
vouchers
death-calcs
settings
```

ข้อมูลเหล่านี้ถูกโหลดเมื่อ application เริ่มทำงาน และบันทึกกลับเมื่อมีการเปลี่ยนแปลงข้อมูล

> **หมายเหตุ:** Storage ในเวอร์ชันปัจจุบันเหมาะสำหรับการทดลองและการใช้งานใน environment ที่รองรับ `window.storage` แต่หากต้องการเปิดให้ผู้ใช้งานหลายคนใช้งานระบบเดียวกันผ่าน Internet ควรเปลี่ยนเป็น Database เช่น Supabase หรือ PostgreSQL

## ☁️ Deployment

โปรเจกต์นี้สามารถ Deploy เป็น Web Application ได้ เช่นผ่าน Vercel

```text
GitHub
   │
   ▼
Vercel
   │
   ▼
ChaPanaKit Web Application
```

Live version:

https://cha-pana-kit-tau.vercel.app/

## 🔮 Future Improvements

แนวทางที่สามารถพัฒนาต่อได้:

* [ ] เปลี่ยน Storage เป็น Supabase / PostgreSQL
* [ ] เพิ่มระบบ Authentication ที่ปลอดภัยมากขึ้น
* [ ] เพิ่ม Role-Based Access Control (RBAC)
* [ ] เพิ่มระบบ Backup และ Restore
* [ ] เพิ่มระบบ Audit Log
* [ ] เพิ่มระบบ Export Excel / CSV
* [ ] เพิ่มรายงานทางการเงินเพิ่มเติม
* [ ] เพิ่ม Responsive UI สำหรับ Mobile
* [ ] เพิ่มระบบแจ้งเตือน
* [ ] เพิ่มระบบจัดการสิทธิ์ผู้ใช้งานแบบละเอียด
* [ ] เพิ่ม Automated Testing
* [ ] เพิ่ม CI/CD Pipeline

## ⚠️ Security Notice

โปรเจกต์เวอร์ชันปัจจุบันเป็นต้นแบบสำหรับระบบบริหารงานภายใน

ระบบ Login ที่มีอยู่เป็นการควบคุมการเข้าถึงเบื้องต้น และข้อมูลผู้ใช้งาน/ข้อมูลระบบยังไม่ได้ออกแบบเป็นระบบ Authentication ระดับ Production

หากนำไปใช้งานจริง ควร:

1. ใช้ Authentication service ที่เหมาะสม
2. ไม่เก็บ Password แบบ Plain Text
3. ใช้ Database ที่มี Access Control
4. กำหนดสิทธิ์การเข้าถึงข้อมูล
5. เปิดใช้งาน HTTPS
6. มีระบบ Backup
7. มี Audit Log สำหรับข้อมูลสำคัญ

## 📄 License

This project is currently for development and educational purposes.

---

## 👨‍💻 Developer

Developed by **Cheer3142**

GitHub:
https://github.com/Cheer3142

Repository:
https://github.com/Cheer3142/ChaPanaKit
