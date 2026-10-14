/**
 * Prisma Database Seeder — Danibrothers POS
 * Seeds initial users, settings, categories, brands, and sample products
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-prisma.ts
 * Or: npx tsx scripts/seed-prisma.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Danibrothers POS database seed...');

  // 1. Shop Settings
  await prisma.shopSettings.upsert({
    where: { id: 'default-shop' },
    update: {},
    create: {
      id: 'default-shop',
      shopName: 'Danibrothers Computers & CCTV',
      address: 'B-13 Sector Z6 Gulshan-e-Maymar, Karachi',
      phone: '+92 300 1234567',
      email: 'danibrothers99@gmail.com',
      currencySymbol: 'Rs.',
      currencyCode: 'PKR',
      timezone: 'Asia/Karachi',
      invoicePrefix: 'INV-',
      purchasePrefix: 'PUR-',
      receiptSize: '58mm',
      taxEnabled: false,
      defaultTaxRate: 0,
      allowNegativeStock: false,
      invoiceFooter: 'Thank you for choosing Danibrothers! Warranty claims require original receipt.',
      warrantyPolicy: '7-Day Check Warranty on used laptops/PCs. Manufacturer warranty applies to boxed items.',
      returnPolicy: 'Returns accepted within 3 days in unsealed condition.',
    },
  });
  console.log('✅ Shop settings seeded');

  // 2. Admin User
  const adminPass = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'danish' },
    update: {},
    create: {
      id: 'usr-danish',
      username: 'danish',
      fullName: 'Danish Saeed',
      email: 'danish@danibrotherspos.com',
      passwordHash: adminPass,
      role: 'ADMIN',
      active: true,
    },
  });

  const managerPass = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      fullName: 'Shop Manager',
      email: 'manager@danibrotherspos.com',
      passwordHash: managerPass,
      role: 'MANAGER',
      active: true,
    },
  });

  const cashierPass = await bcrypt.hash('cashier123', 10);
  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      fullName: 'Counter Cashier',
      email: 'cashier@danibrotherspos.com',
      passwordHash: cashierPass,
      role: 'CASHIER',
      active: true,
    },
  });
  console.log('✅ Users seeded (danish/admin123, manager/manager123, cashier/cashier123)');

  // 3. Categories
  const categories = [
    { id: 'cat-laptops', name: 'Laptops & Notebooks', slug: 'laptops-notebooks', description: 'Gaming, Business and Student Laptops' },
    { id: 'cat-pcs', name: 'Desktops & Gaming PCs', slug: 'desktops-gaming-pcs', description: 'Custom Assembled Systems and Branded Towers' },
    { id: 'cat-cctv', name: 'CCTV Cameras & Surveillance', slug: 'cctv-cameras-surveillance', description: 'DVRs, NVRs, IP cameras, BNC cables' },
    { id: 'cat-components', name: 'Internal Components', slug: 'internal-components', description: 'RAM, SSDs, Hard Drives, Graphics Cards' },
    { id: 'cat-accessories', name: 'Peripherals & Accessories', slug: 'peripherals-accessories', description: 'Keyboards, Mice, Monitors, Cables' },
    { id: 'cat-networking', name: 'Networking & Cables', slug: 'networking-cables', description: 'Routers, Switches, Cat6 cables' },
    { id: 'cat-services', name: 'Services & Repairs', slug: 'it-services-repairs', description: 'Windows Installation, Servicing & Hardware Repairs' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({ where: { id: cat.id }, update: {}, create: cat });
  }
  console.log('✅ Categories seeded');

  // 4. Brands
  const brands = [
    { id: 'br-dell', name: 'Dell' },
    { id: 'br-hp', name: 'HP' },
    { id: 'br-lenovo', name: 'Lenovo' },
    { id: 'br-hikvision', name: 'Hikvision' },
    { id: 'br-dahua', name: 'Dahua' },
    { id: 'br-kingston', name: 'Kingston' },
    { id: 'br-logitech', name: 'Logitech' },
    { id: 'br-tp-link', name: 'TP-Link' },
  ];
  for (const brand of brands) {
    await prisma.brand.upsert({ where: { id: brand.id }, update: {}, create: brand });
  }
  console.log('✅ Brands seeded');

  // 5. Sample Products
  const products = [
    {
      id: 'prd-kingston-ram-8gb',
      name: 'Kingston 8GB DDR4 3200MHz RAM',
      sku: 'KIN-RAM-8GB-DDR4',
      barcode: '1000000010',
      brandId: 'br-kingston',
      categoryId: 'cat-components',
      unit: 'PIECE' as const,
      costPrice: 3500,
      sellingPrice: 4500,
      quantityInStock: 20,
      reorderLevel: 5,
      requiresSerial: false,
      warrantyDurationMonths: 12,
      active: true,
    },
    {
      id: 'prd-hikvision-2mp',
      name: 'Hikvision DS-2CD2143G2-I 4MP AcuSense IP Camera',
      sku: 'HIK-2CD-2143',
      barcode: '2000000001',
      brandId: 'br-hikvision',
      categoryId: 'cat-cctv',
      unit: 'PIECE' as const,
      costPrice: 8500,
      sellingPrice: 11000,
      quantityInStock: 10,
      reorderLevel: 3,
      requiresSerial: false,
      warrantyDurationMonths: 12,
      active: true,
    },
    {
      id: 'prd-logitech-kbd',
      name: 'Logitech MK270 Wireless Keyboard & Mouse Combo',
      sku: 'LOG-MK270',
      barcode: '3000000001',
      brandId: 'br-logitech',
      categoryId: 'cat-accessories',
      unit: 'PIECE' as const,
      costPrice: 2200,
      sellingPrice: 3000,
      quantityInStock: 15,
      reorderLevel: 5,
      requiresSerial: false,
      warrantyDurationMonths: 12,
      active: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }
  console.log('✅ Sample products seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('Login: danish / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
