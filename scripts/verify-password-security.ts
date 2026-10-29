import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function demonstratePasswordSecurity() {
  console.log('==================================================================');
  console.log('  BACSE344 DA3 Q2.a: Sensitive Data & Salted Password Hashes      ');
  console.log('==================================================================\n');

  console.log('1. SENSITIVE DATA IDENTIFICATION IN REPAIRGRAPH:');
  console.log('   - Customer PII: Full Names, Email, Phone Numbers, Device Pickup/Delivery Addresses');
  console.log('   - Hardware Identity: Device Serial Numbers, IMEI, Tamper-Evident Passport Records');
  console.log('   - Financial Data: Itemized Repair Quotes, Labor/Part Invoices, Technician Rates\n');

  console.log('2. LIVE NEON CLOUD POSTGRESQL DATABASE RECORDS:');
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, passwordHash: true },
    take: 4,
  });

  console.log('ID                           | Name         | Email                  | Role     | Stored Password (Bcrypt Salted Hash)');
  console.log('-----------------------------+--------------+------------------------+----------+-------------------------------------------------------------');
  for (const u of users) {
    console.log(`${u.id.padEnd(28)} | ${u.name.padEnd(12).slice(0, 12)} | ${u.email.padEnd(22).slice(0, 22)} | ${u.role.padEnd(8)} | ${u.passwordHash}`);
  }

  console.log('\n3. SALTED HASH ANATOMY ($2b$10$...):');
  const sampleHash = users[0].passwordHash;
  console.log('   Algorithm Identifier: $2b (Bcrypt standard)');
  console.log('   Cost / Work Factor:   10 (2^10 = 1,024 key expansion rounds)');
  console.log('   Cryptographic Salt:  ', sampleHash.substring(7, 29), '(22 random base64 chars)');
  console.log('   Ciphertext Digest:   ', sampleHash.substring(29), '(31 base64 chars)');

  console.log('\n4. RAINBOW TABLE IMMUNITY TEST (Same Password -> Completely Different Hashes):');
  const testPw = 'RepairSecurePass@2026';
  const hashA = await bcrypt.hash(testPw, 10);
  const hashB = await bcrypt.hash(testPw, 10);
  console.log('   Plaintext Password : ', testPw);
  console.log('   Generated Hash A   : ', hashA);
  console.log('   Generated Hash B   : ', hashB);
  console.log('   Hashes Identical?  : ', hashA === hashB ? 'YES (VULNERABLE)' : 'NO (SECURE - Salt Unique to Each Entry)');
  console.log('   Hash A Verifies?   : ', await bcrypt.compare(testPw, hashA));
  console.log('   Hash B Verifies?   : ', await bcrypt.compare(testPw, hashB));
}

demonstratePasswordSecurity().catch(console.error).finally(() => prisma.$disconnect());
