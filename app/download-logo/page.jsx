'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Check, Sparkles, ArrowLeft, Eye, ShieldCheck } from 'lucide-react';

const InstagramIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function DownloadLogoPage() {
  const [previewMode, setPreviewMode] = useState('circle'); // 'circle' | 'square'
  const [downloaded, setDownloaded] = useState({});

  const handleDownload = (key) => {
    setDownloaded((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setDownloaded((prev) => ({ ...prev, [key]: false }));
    }, 3000);
  };

  const assets = [
    {
      id: 'ig-jpg',
      title: 'Instagram Profile Picture (Recommended)',
      desc: '1080×1080 JPG on solid crisp white. Optimized for Instagram’s circular avatar crop.',
      file: '/logos/instagram_dp_official.jpg',
      filename: 'mymobpay_instagram_profile.jpg',
      badge: 'Instagram Ready',
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: '4k-png',
      title: 'Ultra HD 4K Master (Solid White)',
      desc: '2048×2048 Lossless PNG. Ultra-high resolution supersampled for high-DPI displays and print.',
      file: '/logos/instagram_dp_4k.png',
      filename: 'mymobpay_logo_4k_white.png',
      badge: 'Ultra HD 4K',
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    },
    {
      id: 'trans-png',
      title: 'Ultra HD 4K Transparent Mark',
      desc: '2048×2048 Transparent PNG with no background. Perfect for Instagram Stories, Reels, watermark, & website.',
      file: '/logos/instagram_dp_4k_transparent.png',
      filename: 'mymobpay_logo_4k_transparent.png',
      badge: 'Transparent PNG',
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to MyMobPay
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Official Brand Assets</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-3">
            <InstagramIcon className="w-3.5 h-3.5" />
            <span>@mymobpay Official Instagram DP</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Download Official Logo
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Authentic original website ribbon mark, high-resolution upscaled & formatted with circular crop safe margins.
          </p>
        </div>

        {/* Grid: Preview & Downloads */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Preview Box */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Preview</span>
              {/* Preview Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPreviewMode('circle')}
                  className={`px-2.5 py-1 rounded-md transition-all ${previewMode === 'circle' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Instagram Circle
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('square')}
                  className={`px-2.5 py-1 rounded-md transition-all ${previewMode === 'square' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Square 1:1
                </button>
              </div>
            </div>

            {/* Avatar Preview Display */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 my-2 relative flex items-center justify-center p-2 bg-gradient-to-b from-slate-100 to-slate-200 rounded-3xl border border-slate-200/80">
              {/* The Image Container */}
              <div
                className={`w-full h-full bg-white overflow-hidden shadow-md flex items-center justify-center transition-all duration-300 ${
                  previewMode === 'circle' ? 'rounded-full border-4 border-white ring-2 ring-slate-300' : 'rounded-2xl border border-slate-200'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logos/instagram_dp_official.jpg"
                  alt="MyMobPay Official Instagram Profile"
                  className="w-full h-full object-contain"
                />
              </div>

              {previewMode === 'circle' && (
                <div className="absolute -bottom-3 bg-slate-900 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Safe inside Circle</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center mt-5 leading-relaxed">
              {previewMode === 'circle' 
                ? 'This is exactly how your profile looks on the Instagram app with zero edges cut off.'
                : 'Full square canvas before Instagram applies its circular mask.'}
            </p>
          </div>

          {/* Right Download Cards */}
          <div className="lg:col-span-7 space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${asset.color}`}>
                      {asset.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{asset.title}</h3>
                  <p className="text-xs text-slate-500 leading-normal max-w-md">{asset.desc}</p>
                </div>

                <a
                  href={asset.file}
                  download={asset.filename}
                  onClick={() => handleDownload(asset.id)}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shrink-0 ${
                    downloaded[asset.id]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
                  }`}
                >
                  {downloaded[asset.id] ? (
                    <>
                      <Check className="w-4 h-4" /> Downloaded
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Download
                    </>
                  )}
                </a>
              </div>
            ))}

            {/* Quick Tips Box */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1">
                <span className="font-semibold block">How to upload on Instagram:</span>
                <p className="text-blue-700 leading-relaxed">
                  1. Click <strong>Download</strong> on the <strong>Instagram Profile Picture</strong> above.<br/>
                  2. Open Instagram → Edit Profile → Change Profile Photo → Select the downloaded file.<br/>
                  3. Instagram will automatically crop it into a circle — the ribbon logo will sit perfectly centered with generous margins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
        © 2026 MyMobPay. Direct UPI & Bank Settlement Gateway.
      </footer>
    </div>
  );
}
