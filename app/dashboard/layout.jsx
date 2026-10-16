export const metadata = {
  title: 'Merchant Dashboard',
  description: 'Manage your live UPI transactions, view real-time settlement analytics, create payment links, and configure webhook endpoints.',
  alternates: {
    canonical: '/dashboard',
  },
  openGraph: {
    title: 'Merchant Dashboard — MyMobPay',
    description: 'Monitor real-time payments and bank settlements with 0% gateway fees.',
    url: 'https://mymob.tech/dashboard',
  },
};

export default function DashboardLayout({ children }) {
  return children;
}
