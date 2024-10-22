'use client';
import React, { useState } from 'react';
import PersonalInformation from './PersonalInformation';
import { CheckCircle } from 'lucide-react';
import AddFriend from './AddFriend';

const ProfileSetup = () => {
  const [step, setStep] = useState(0);

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Set up your profile details' },
    { number: 2, title: 'Add Friends', description: 'Connect with others' },
  ];

  const handleProfileComplete = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header for small screens */}
      <div className="md:hidden bg-white shadow-md p-4">
        <h2 className="text-xl font-bold text-gray-900">Profile Setup</h2>
        <div className="mt-4 flex items-center">
          <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-600 text-blue-600">
            {step + 1}
          </span>
          <span className="ml-3 text-sm font-medium">{steps[step].title}</span>
        </div>
        <p className="mt-2 text-sm text-gray-600">{steps[step].description}</p>
      </div>

      <div className="flex flex-col md:flex-row flex-grow">
        {}
        <div className="hidden md:block w-64 bg-white shadow-md">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile Setup</h2>
            <p className="mt-2 text-sm text-gray-600">Complete your account</p>
          </div>
          <nav aria-label="Progress" className="mt-4">
            <ol className="space-y-6 px-4">
              {steps.map((stepItem, index) => (
                <li key={stepItem.number} className="relative">
                  <div className={`flex items-start ${
                    step >= index ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      step >= index ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {step > index ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span>{stepItem.number}</span>
                      )}
                    </span>
                    <span className="ml-3 text-sm font-medium">{stepItem.title}</span>
                  </div>
                  <p className={`mt-0.5 ml-11 text-xs ${
                    step >= index ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepItem.description}
                  </p>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {}
        <div className="flex-grow bg-white shadow-md p-4 md:p-8 overflow-auto">
          <div className="max-w-2xl mx-auto">
            {step === 0 && (
              <PersonalInformation onComplete={handleProfileComplete} />
            )}
            {step === 1 && (
              <AddFriend />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;