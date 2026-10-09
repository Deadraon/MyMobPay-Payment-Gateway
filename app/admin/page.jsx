import { notFound } from 'next/navigation';

// Enterprise Stealth Architecture:
// Public /admin route is intentionally disabled and hidden from the public internet.
// External visitors, bots, and crawlers will receive an HTTP 404 Not Found response.
// Authorized platform administrators access the Super Admin Console directly inside /dashboard.
export default function AdminPage() {
  notFound();
}
