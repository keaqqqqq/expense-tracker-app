'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { Sparkles, Menu, Receipt, Bell, Users, CreditCard } from 'lucide-react';

const ExpenseLanding = () => {
  const [borderColor, setBorderColor] = useState({ r: 100, g: 100, b: 255 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setBorderColor(prev => ({
        r: Math.sin(Date.now() / 2000) * 127 + 128,
        g: Math.sin(Date.now() / 2000 + 2) * 127 + 128,
        b: Math.sin(Date.now() / 2000 + 4) * 127 + 128
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (isSignUp = false) => {
    router.push(`/auth?mode=${isSignUp ? 'signup' : 'signin'}`);
  };

  const features = [
    {
      icon: <Receipt className="w-6 h-6" />,
      title: "Smart Bill Splitting",
      description: "Automatically split expenses equally or customize amounts for each person in your group."
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Real-time Notifications",
      description: "Get instant updates when someone adds an expense or settles a payment."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Group Management",
      description: "Create multiple groups for different occasions - roommates, trips, events, and more."
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Easy Settlements",
      description: "Simplify debt resolution with clear settlement suggestions and payment tracking."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F7FF] to-[#F0EFFF] flex flex-col">
      <nav className="w-full px-6 sm:px-10 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center relative overflow-hidden">
              <Sparkles className="w-5 h-5 text-white" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-transparent bg-clip-text">
              ExpenseHive
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex gap-4">
            <button onClick={() => handleNavigation(false)} className="px-4 py-2 text-gray-700 hover:text-[#4F46E5] transition-colors">
              Sign in
            </button>
            <button onClick={() => handleNavigation(true)} className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-all hover:shadow-lg hover:-translate-y-0.5">
              Sign up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="sm:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-16 bg-white shadow-lg p-4 flex flex-col gap-2 z-50">
          <button onClick={() => handleNavigation(false)} className="px-4 py-2 text-gray-700 hover:text-[#4F46E5] transition-colors w-full text-left">
            Sign in
          </button>
          <button onClick={() => handleNavigation(true)} className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-all w-full text-left">
            Sign up
          </button>
        </div>
      )}

      <main className="flex-grow flex px-6 sm:px-10 py-8 sm:py-12">
        <div className="max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Text Content */}
            <div className="relative flex flex-col justify-between h-auto lg:h-[420px] order-2 lg:order-1">
              <div>
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-blue-500 opacity-5 rounded-full blur-xl" />
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-purple-500 opacity-5 rounded-full blur-xl" />
                
                <h1 className="text-4xl sm:text-5xl font-bold mb-5 [line-height:1.3] sm:[line-height:1.3]">
                  <div>
                    Effortless Expense{' '}
                    <span className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-transparent bg-clip-text">
                      Tracking with{' '}
                    </span>
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-transparent bg-clip-text">
                      Friends
                    </span>
                    {' '}and{' '}
                    <span className="bg-gradient-to-r from-[#8B5CF6] to-[#9333EA] text-transparent bg-clip-text">
                      Groups
                    </span>
                  </div>
                </h1>
                
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  Split bills with friends, get real-time notifications, and manage your finances on the go with our Progressive Web App. Stay on top of your expenses and never miss a payment!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6 sm:mt-4">
                <button 
                  className="group px-6 py-3 bg-[#4F46E5] text-white rounded-lg text-base sm:text-lg font-medium relative overflow-hidden hover:shadow-xl transition-shadow w-full sm:w-auto"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <span className="relative z-10">Start Tracking Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isHovered && (
                    <div className="absolute inset-0 bg-[url('/api/placeholder/10/10')] opacity-5" />
                  )}
                </button>
                <button className="px-6 py-3 text-[#4F46E5] rounded-lg text-base sm:text-lg font-medium hover:bg-white/50 transition-colors w-full sm:w-auto">
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Right Column - Video */}
            <div className="relative flex items-center h-[300px] sm:h-[360px] lg:h-[420px] order-1 lg:order-2">
              <div 
                className="w-full h-full rounded-xl relative overflow-hidden bg-white shadow-2xl"
                style={{
                  border: `4px solid rgba(${borderColor.r}, ${borderColor.g}, ${borderColor.b}, 0.5)`,
                  transition: 'border-color 0.3s ease'
                }}
              >
                <div className="absolute inset-0">
                  <div className="absolute top-0 left-0 right-0 h-8 sm:h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-400" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400" />
                    </div>
                  </div>
                  
                  <div className="absolute top-10 sm:top-12 inset-x-4 bottom-4 bg-gray-50 rounded-lg">
                    <div className="absolute top-4 left-4 right-4 h-24 sm:h-32 bg-gray-100 rounded-lg" />
                    <div className="absolute bottom-4 left-4 right-4 h-16 sm:h-24 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
              <div className="absolute -top-6 -left-6 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </main>
      <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-transparent bg-clip-text">
                Powerful Features
              </span>
              {' '}for Easy Expense Management
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to manage shared expenses and keep track of your finances in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="bg-[#4F46E5]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-[#4F46E5]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
    </div>
  );
};

export default ExpenseLanding;