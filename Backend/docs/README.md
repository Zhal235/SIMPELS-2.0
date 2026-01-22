# SIMPELS Backend Documentation

Dokumentasi lengkap untuk SIMPELS Backend API

## 📁 Struktur Dokumentasi

### 🔧 [Fixes](fixes/)
Dokumentasi bug fixes dan perbaikan sistem:
- Bootstrap fixes dan patches
- NGINX configuration fixes  
- Storage path fixes
- Quick fix references

### 🚀 [Deployment](deployment/)
Panduan deployment dan konfigurasi server:
- Linux deployment scripts
- Production checklist
- Final deployment success notes

### 📦 [Archive](archive/)
File-file lama dan debug scripts yang sudah tidak digunakan:
- Bootstrap reference files
- Debug scripts
- Test files lama

## 📋 API Endpoints Overview

### Authentication
- `POST /auth/login` - Login wali santri/admin
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user info

### Santri Management  
- `GET /santri` - List all santri
- `GET /santri/{id}` - Get santri detail
- `POST /santri` - Create santri (admin)
- `PUT /santri/{id}` - Update santri (admin)

### Digital Wallet
- `GET /wallet/{santri_id}` - Get wallet balance
- `POST /wallet/topup` - Top up wallet
- `GET /wallet/transactions` - Get transaction history

### ePOS System
- `POST /epos/transaction` - Process ePOS transaction (RFID)
- `GET /epos/pool` - Get ePOS pool balance

### Notifications
- `GET /notifications` - Get user notifications
- `POST /notifications/mark-read` - Mark as read

## 🔐 Security Features

- JWT Authentication
- Role-based access (admin/user)
- Global minimum balance enforcement
- Transaction limits per santri
- CORS protection

## 🏦 BSI Integration

Sistem terintegrasi dengan Bank Syariah Indonesia untuk:
- Payment gateway
- Bank account management  
- Financial reporting
- Digital wallet top-up

---

**© 2026 SIMPELS - Bank Syariah Indonesia**