'use client';

import React, { useEffect, useState, useRef, RefObject } from 'react';
import { useRouter } from 'next/navigation'; 
import { Sparkles, Menu, Receipt, Bell, Users, BarChart, Monitor} from 'lucide-react';

const fadeInUp = "opacity-0 translate-y-24 scale-95 transition-all duration-1000 ease-out"; 
const visible = "opacity-100 translate-y-0 scale-100";

const useIntersectionObserver = (options = {}): [RefObject<HTMLDivElement>, boolean] => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          setIsVisible(true);
        }, 200); 
      }
    }, { threshold: 0.1, ...options }); 

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [options]);

  return [elementRef, isVisible];
};


const ExpenseLanding = () => {
  const [borderColor, setBorderColor] = useState({ r: 100, g: 100, b: 255 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const [heroRef, heroVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [demoRef, demoVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [featuresRef, featuresVisible] = useIntersectionObserver({ threshold: 0.1 });

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
      icon: <Monitor className="w-8 h-8" />,
      title: "PWA-Enhanced Experience",
      description: "Access your financial tracker on mobile and desktop, just like a native app—no downloads required."
    },    
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Real-time Notifications",
      description: "Get instant updates when someone adds an expense or settles a payment."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Group Management",
      description: "Create multiple groups for different occasions - roommates, trips, events, and more."
    },
    {
      icon: <BarChart className="w-8 h-8" />,
      title: "Insightful Statistics",
      description: "Get detailed insights with visualized data and track your spending patterns to make smarter financial decisions."
    }    
  ];

  // CSS classes for animations
  const fadeInUp = "opacity-0 translate-y-10 transition-all duration-1000";
  const visible = "opacity-100 translate-y-0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F7FF] to-[#F0EFFF] flex flex-col overflow-x-hidden overflow-y-hidden">
      <nav className="w-full px-6 sm:px-10 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="././icons/icon-72x72.png" alt="" className='border rounded-lg h-10 w-10'/>
            <span className="font-bold text-xl">
            <span className="text-gray-900">Expense</span>
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-transparent bg-clip-text">Hive</span>
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

      {/* Hero Section */}
      <main 
        ref={heroRef} 
        className={`flex-grow flex px-6 sm:px-10 py-5 2xl:py-20  ${fadeInUp} ${heroVisible ? visible : ''}`}
      >
        <div className="max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
            {/* Left Column - Text Content */}
            <div className="relative flex flex-col justify-between h-auto lg:h-[420px] order-2 lg:order-1 lg:col-span-2 lg:ml-10">
              <div>
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-blue-500 opacity-5 rounded-full blur-xl" />
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-purple-500 opacity-5 rounded-full blur-xl" />
                
                <h1 className="text-4xl sm:text-5xl font-bold mb-5 [line-height:1.3] sm:[line-height:1.3]">
                  <div>
                    Effortless Expense
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-transparent bg-clip-text">
                      Tracking with
                    </span>
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-transparent bg-clip-text">
                      Friends{' '}
                    </span>
                    and{' '}
                    <span className="bg-gradient-to-r from-[#8B5CF6] to-[#9333EA] text-transparent bg-clip-text">
                      Groups
                    </span>
                  </div>
                </h1>
              
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Say goodbye to awkward money conversations and complex calculations. Our tool transforms group finances into effortless collaboration, making expense tracking seamless and stress-free.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6 sm:mt-4">
                <button 
                  className="group px-8 py-3 bg-[#4F46E5] text-white rounded-lg text-base sm:text-lg font-medium relative overflow-hidden hover:shadow-xl transition-shadow w-full sm:w-auto"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onClick={() => handleNavigation(true)}  
                >
                  <span className="relative z-10">Start Tracking Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isHovered && (
                    <div className="absolute inset-0 bg-[url('/api/placeholder/10/10')] opacity-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Right Column - Video */}
            <div className="relative flex items-center justify-center order-1 lg:order-2 w-full lg:mx-8 lg:col-span-2">
              <div className="rounded-xl overflow-hidden border-4 border-black">
                <video 
                  className="w-[250px]"
                  autoPlay 
                  loop 
                  muted
                  playsInline
                  controls
                >
                  <source src="/gif.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
              
              {/* Gradient effects */}
              <div className="absolute -bottom-6 -right-6 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
              <div className="absolute -top-6 -left-6 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </main>

{/* Demo Video Section */}
<section 
  ref={demoRef} 
  className={`relative py-24 bg-indigo-600 ${fadeInUp} ${demoVisible ? visible : ''}`}
>
  <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10">
    <div className={`text-center mb-16 transition-all duration-1000 delay-300 transform ${demoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
        <span className="bg-gradient-to-r from-white to-indigo-200 text-transparent bg-clip-text">
          Transform How You Share
        </span>
        {' '}Expenses Together
      </h2>
      <p className="text-indigo-100 text-lg max-w-3xl mx-auto leading-relaxed">
        Experience our intuitive platform that turns complex group expenses into simple, stress-free interactions. See how ExpenseHive makes tracking shared costs as natural as sharing moments with friends.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
      <div className={`relative flex justify-center lg:col-span-5 transition-all duration-1000 delay-500 transform ${demoVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
        <div className="rounded-xl overflow-hidden border-4 border-indigo-400/30 relative max-w-[1000px] w-full mx-auto shadow-2xl">
          <video 
            className="w-full"
            autoPlay 
            loop 
            muted
            playsInline
            controls
          >
            <source src="/website.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
          {/* Enhanced decorative gradients */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-white/20 to-indigo-300/20 rounded-full blur-2xl" />
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-br from-indigo-300/20 to-white/20 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  </div>

  {/* Background decorative elements */}
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
    <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-50" />
    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-700 rounded-full blur-3xl opacity-50" />
  </div>
</section>

      {/* Features Section */}
      <div 
        ref={featuresRef}
        className={`py-24 bg-white/30 backdrop-blur-sm flex-1 ${fadeInUp} ${featuresVisible ? visible : ''}`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-transparent bg-clip-text">
                Powerful Features
              </span>
              {' '}for Easy Expense Management
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to manage shared expenses and keep track of your finances in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group flex flex-col items-center text-center"
              >
                <div className="bg-gradient-to-br from-[#4F46E5] to-[#6366F1] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-indigo-500/20 transform transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed max-w-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex justify-center">
          <div className="h-1 w-20 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] rounded-full opacity-50" />
        </div>
      </div>

    </div>
  );
};

export default ExpenseLanding;