'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage('Email verified successfully! Welcome to JobPing.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Verification failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div 
        className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {status === 'verifying' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2 text-gray-800">Verifying your email...</h1>
            <p className="text-gray-600">Please wait while we verify your account.</p>
          </motion.div>
        )}
        
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2 text-green-700">Email Verified!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-700 font-medium">
                🎉 Your first job matches will arrive at <strong>11:11 AM tomorrow</strong>!
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Check your email for your welcome message and next steps.
            </p>
          </motion.div>
        )}
        
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2 text-red-700">Verification Failed</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">
                This could be because:
              </p>
              <ul className="text-sm text-red-600 mt-2 list-disc list-inside">
                <li>The link has expired (24 hours)</li>
                <li>The link was already used</li>
                <li>The link is invalid</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500">
              Need help? Contact support at{' '}
              <a href="mailto:help@jobping.ai" className="text-blue-600 hover:underline">
                help@jobping.ai
              </a>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Loading...</h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
