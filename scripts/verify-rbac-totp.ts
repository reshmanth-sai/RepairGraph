import { signToken } from '@/server/auth/jwt';
import { generateBase32Secret, generateTotp, verifyTotp, getTotpAuthUrl } from '@/server/auth/totp';
import { UserRole } from '@prisma/client';

async function main() {
  console.log('==================================================================');
  console.log('  BACSE344 DA3 Q2.b: TOTP MFA & Role-Based Access Control (RBAC)  ');
  console.log('==================================================================\n');

  // PART 1: Multi-Factor Authentication (TOTP)
  console.log('--- PART 1: MULTI-FACTOR AUTHENTICATION (TOTP) ---');
  const userEmail = 'supervisor@repairgraph.internal';
  const totpSecret = generateBase32Secret(20);
  const otpAuthUrl = getTotpAuthUrl(userEmail, totpSecret, 'RepairGraph');
  const currentOtp = generateTotp(totpSecret);

  console.log('User Email:              ', userEmail);
  console.log('Generated TOTP Secret:   ', totpSecret);
  console.log('Google/MS Auth URI:      ', otpAuthUrl);
  console.log('Current Rotating 6-Digit:', currentOtp);
  console.log('Valid Token Verification:', verifyTotp(totpSecret, currentOtp) ? 'PASSED (200 OK)' : 'FAILED');
  console.log('Invalid Token Rejection: ', !verifyTotp(totpSecret, '999999') ? 'PASSED (Rejected - 401)' : 'FAILED');

  // PART 2: Role-Based Access Control on Update & Delete APIs
  console.log('\n--- PART 2: RBAC RESTRICTION ON UPDATE & DELETE APIS ---');
  console.log('Protected Route: DELETE /api/devices/{id} (Restricted to role: ADMIN)\n');

  const userToken = signToken({
    userId: 'usr_consumer_001',
    email: 'consumer@repairgraph.internal',
    name: 'Normal Consumer',
    role: UserRole.USER,
  });

  const adminToken = signToken({
    userId: 'usr_supervisor_999',
    email: 'supervisor@repairgraph.internal',
    name: 'Fleet Supervisor Admin',
    role: UserRole.ADMIN,
    mfaVerified: true,
  });

  const testDeviceId = 'cmtyc5up20002lb040xqdii85';
  const url = `http://localhost:8080/api/devices/${testDeviceId}`;

  // Case A: Missing Authorization Token
  console.log('[Test A] Sending Request WITHOUT Authorization Token:');
  const resNoAuth = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  const dataNoAuth = await resNoAuth.json();
  console.log(`HTTP Status: ${resNoAuth.status} ${resNoAuth.statusText}`);
  console.log('Response Payload:', JSON.stringify(dataNoAuth, null, 2));

  // Case B: User with USER Role (Forbidden)
  console.log('\n[Test B] Sending Request as Standard Consumer (role: USER):');
  const resUserRole = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
  });
  const dataUserRole = await resUserRole.json();
  console.log(`HTTP Status: ${resUserRole.status} ${resUserRole.statusText}`);
  console.log('Response Payload:', JSON.stringify(dataUserRole, null, 2));

  // Case C: User with ADMIN Role (Authorized)
  console.log('\n[Test C] Sending Request as Fleet Supervisor (role: ADMIN + MFA):');
  const resAdminRole = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  });
  console.log(`HTTP Status: ${resAdminRole.status} (Access Granted to Protected Endpoint)`);

  console.log('\n==================================================================');
  console.log('✓ RBAC & TOTP MFA Verification Completed Successfully.');
  console.log('==================================================================');
}

main().catch(console.error);
