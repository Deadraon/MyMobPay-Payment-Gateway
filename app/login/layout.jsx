export const metadata = {
  title: 'Log in or sign up',
  description: 'Log in or sign up for MyMobPay. Access your direct UPI payment gateway merchant dashboard, API keys, live webhook logs, and automated bank settlements.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Log in or sign up — MyMobPay Merchant Portal',
    description: 'Access your MyMobPay merchant account to accept direct UPI payments with 0% transaction fees.',
    url: 'https://mymobpay.tech/login',
  },
};

export default function LoginLayout({ children }) {
  return children;
}
