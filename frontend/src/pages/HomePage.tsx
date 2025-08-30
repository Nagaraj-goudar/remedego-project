import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef } from 'react';

const HomePage: React.FC = () => {
  const refHow = useRef(null);
  const refWhy = useRef(null);
  const refPrivacy = useRef(null);
  const inViewHow = useInView(refHow, { once: true, margin: '-100px' });
  const inViewWhy = useInView(refWhy, { once: true, margin: '-100px' });
  const inViewPrivacy = useInView(refPrivacy, { once: true, margin: '-100px' });
  const controlsHow = useAnimation();
  const controlsWhy = useAnimation();
  const controlsPrivacy = useAnimation();

  useEffect(() => {
    if (inViewHow) controlsHow.start({ opacity: 1, y: 0 });
  }, [inViewHow, controlsHow]);
  useEffect(() => {
    if (inViewWhy) controlsWhy.start({ opacity: 1, y: 0 });
  }, [inViewWhy, controlsWhy]);
  useEffect(() => {
    if (inViewPrivacy) controlsPrivacy.start({ opacity: 1, y: 0 });
  }, [inViewPrivacy, controlsPrivacy]);
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 py-24">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary-300 rounded-full blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-secondary-300 rounded-full blur-3xl opacity-40 animate-blob"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Pharmacy, <span className="text-primary-600">Simplified</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Upload prescriptions, get verified by licensed pharmacists, and receive medicines at your door.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  to="/register"
                  className="inline-block bg-primary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg"
                >
                  Get Started
                </Link>
                <Link to="/login" className="inline-block px-8 py-4 rounded-xl text-lg font-semibold border border-gray-300 hover:border-primary-600 hover:text-primary-600 transition-colors">
                  I already have an account
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2 animate-float"><span className="w-2 h-2 bg-green-500 rounded-full"></span> HIPAA compliant</div>
                <div className="flex items-center gap-2 animate-float" style={{ animationDelay: '1s' }}><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Bank-level security</div>
              </div>
            </motion.div>
            <motion.div className="relative" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }}>
              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary-400 to-secondary-400 rounded-3xl blur-2xl opacity-25"></div>
                <div className="relative bg-white rounded-3xl shadow-xl p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.div key={i} className="h-24 rounded-xl bg-gradient-to-br from-primary-50 to-white border border-gray-100 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={refHow}>
          <motion.h2 className="text-3xl font-bold text-center text-gray-900 mb-12" initial={{ opacity: 0, y: 20 }} animate={controlsHow} transition={{ duration: 0.6 }}>
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={controlsHow} transition={{ duration: 0.6, delay: 0.1 }}>
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload</h3>
              <p className="text-gray-600">
                Simply upload your prescription photo or scan. Our system accepts all common formats.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={controlsHow} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Verify</h3>
              <p className="text-gray-600">
                Our licensed pharmacists review your prescription and verify all details for accuracy.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={controlsHow} transition={{ duration: 0.6, delay: 0.3 }}>
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Notified</h3>
              <p className="text-gray-600">
                Receive real-time updates on your order status and get notified when it's ready for delivery.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={refWhy}>
          <motion.h2 className="text-3xl font-bold text-center text-gray-900 mb-12" initial={{ opacity: 0, y: 20 }} animate={controlsWhy} transition={{ duration: 0.6 }}>
            Why Choose ReMedGo?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" initial={{ opacity: 0, y: 20 }} animate={controlsWhy} transition={{ duration: 0.6, delay: 0.1 }}>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-Time Order Tracking</h3>
              <p className="text-gray-600">
                Track your prescription from upload to delivery with our comprehensive tracking system.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" initial={{ opacity: 0, y: 20 }} animate={controlsWhy} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">One-Click Refills</h3>
              <p className="text-gray-600">
                Set up automatic refills and never worry about running out of medication again.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" initial={{ opacity: 0, y: 20 }} animate={controlsWhy} transition={{ duration: 0.6, delay: 0.3 }}>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-gray-600">
                Your health information is protected with bank-level security and HIPAA compliance.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" initial={{ opacity: 0, y: 20 }} animate={controlsWhy} transition={{ duration: 0.6, delay: 0.4 }}>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast Delivery</h3>
              <p className="text-gray-600">
                Get your medications delivered to your doorstep within 24-48 hours.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" initial={{ opacity: 0, y: 20 }} animate={controlsWhy} transition={{ duration: 0.6, delay: 0.5 }}>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">24/7 Support</h3>
              <p className="text-gray-600">
                Our pharmacy team is available round the clock to answer your questions.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" initial={{ opacity: 0, y: 20 }} animate={controlsWhy} transition={{ duration: 0.6, delay: 0.6 }}>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Licensed Pharmacists</h3>
              <p className="text-gray-600">
                All prescriptions are reviewed by licensed, experienced pharmacists.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust and Security Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" ref={refPrivacy}>
          <motion.h2 className="text-3xl font-bold text-gray-900 mb-8" initial={{ opacity: 0, y: 20 }} animate={controlsPrivacy} transition={{ duration: 0.6 }}>
            Your Privacy is Our Priority
          </motion.h2>
          <motion.p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={controlsPrivacy} transition={{ duration: 0.6, delay: 0.1 }}>
            We understand the sensitive nature of your health information. That's why we use 
            industry-leading security measures to protect your data.
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Security Feature 1 */}
            <motion.div className="flex flex-col items-center hover:scale-105 transition-transform" initial={{ opacity: 0, y: 20 }} animate={controlsPrivacy} transition={{ duration: 0.6, delay: 0.1 }}>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">HIPAA Compliant</h3>
              <p className="text-gray-600 text-sm">Full compliance with healthcare privacy regulations</p>
            </motion.div>

            {/* Security Feature 2 */}
            <motion.div className="flex flex-col items-center hover:scale-105 transition-transform" initial={{ opacity: 0, y: 20 }} animate={controlsPrivacy} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Bank-Level Security</h3>
              <p className="text-gray-600 text-sm">256-bit SSL encryption for all data</p>
            </motion.div>

            {/* Security Feature 3 */}
            <motion.div className="flex flex-col items-center hover:scale-105 transition-transform" initial={{ opacity: 0, y: 20 }} animate={controlsPrivacy} transition={{ duration: 0.6, delay: 0.3 }}>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Secure Storage</h3>
              <p className="text-gray-600 text-sm">Your data is stored in secure, encrypted databases</p>
            </motion.div>

            {/* Security Feature 4 */}
            <motion.div className="flex flex-col items-center hover:scale-105 transition-transform" initial={{ opacity: 0, y: 20 }} animate={controlsPrivacy} transition={{ duration: 0.6, delay: 0.4 }}>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Fraud Protection</h3>
              <p className="text-gray-600 text-sm">Advanced fraud detection and prevention systems</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 