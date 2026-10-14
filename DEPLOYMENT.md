# Danibrothers POS & Inventory Management System
## Production Deployment, LAN Setup & Disaster Recovery Guide

This system is built specifically for computer, laptop, accessories, and CCTV retail operations. It runs on a local Windows server or central shop computer, providing access for counter POS terminals and back-office workstations across your local network (LAN) without requiring continuous internet access.

---

### 1. Technology & Architecture Highlights
- **Framework:** Next.js (App Router) + React 19 + TypeScript
- **Styling & UI:** Tailwind CSS + custom shadcn/ui components
- **Database & ORM:** PostgreSQL schema with normalized relational models + persistent fallback adapter
- **Security:** bcryptjs password hashing + signed HTTP-only JWT session cookies
- **Financial Engine:** Exact integer and decimal precision calculations preventing floating-point drift
- **Hardware Integration:** USB Barcode Scanner (keyboard wedge stream support) + Code 128 barcode generation + thermal receipt printer support (58mm, 80mm, and A4)

---

### 2. Environment Variables Configuration
Copy the provided `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `DATABASE_URL`: Connection string to your PostgreSQL instance (e.g. `postgresql://postgres:password@localhost:5432/danibrothers_pos?schema=public`)
- `JWT_SECRET`: Minimum 32-character secure secret
- `NEXT_PUBLIC_APP_URL`: Local URL or LAN IP (e.g. `http://192.168.1.50:3000`)
- `TIMEZONE`: `Asia/Karachi` (or your local timezone)
- `DEFAULT_CURRENCY`: `PKR`
- `DEFAULT_CURRENCY_SYMBOL`: `Rs.`

---

### 3. Local Network (LAN) Configuration for Counter Terminals
To allow multiple counter laptops or tablets on your shop's Wi-Fi / Ethernet to access the POS terminal:

1. **Find the Main Server's LAN IP Address**:
   Open PowerShell and run:
   ```powershell
   ipconfig
   ```
   Note the **IPv4 Address** (e.g. `192.168.1.50`).

2. **Open the Windows Firewall Port**:
   Run PowerShell as Administrator on the server computer:
   ```powershell
   New-NetFirewallRule -DisplayName "Danibrothers POS Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

3. **Start Next.js bound to all network interfaces**:
   ```powershell
   npm run build
   npx next start -H 0.0.0.0 -p 3000
   ```

4. **Access from Cashier Terminals**:
   Open Google Chrome on any cash register computer and navigate to:
   ```
   http://192.168.1.50:3000/pos
   ```

---

### 4. Database Backup & Disaster Recovery Strategy

#### A. Creating a Database Backup
Run the backup script daily or before major inventory audits:
```powershell
# Create timestamped dump
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump -U postgres -d danibrothers_pos -F c -b -v -f "D:\Backups\danibrothers_pos_$timestamp.dump"
```
> [!IMPORTANT]
> Always store backups on an external USB hard drive or secondary network drive—never keep backups solely on the primary system disk.

#### B. Restoring After Hardware Failure
1. Install PostgreSQL on the replacement server.
2. Create an empty database:
   ```sql
   CREATE DATABASE danibrothers_pos;
   ```
3. Restore the latest backup:
   ```powershell
   pg_restore -U postgres -d danibrothers_pos -v "D:\Backups\danibrothers_pos_latest.dump"
   ```
4. Verify record counts and start the Next.js service.

---

### 5. Default Role Logins
Initial demonstration accounts:
- **Admin**: `admin` / `admin123` (Full administrative, pricing, discount, settings, and financial rights)
- **Manager**: `manager` / `manager123` (Stock operations, purchases, and sales approvals)
- **Cashier**: `cashier` / `cashier123` (High-speed checkout terminal, scanning, and receipt printing)
- **Inventory Staff**: `inventory` / `cashier123` (Stock inwards and goods receiving)
