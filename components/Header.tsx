
import React from 'react';
import { LogoIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center">
        <LogoIcon className="h-8 w-8 text-indigo-600 mr-3" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">AI Drawing Automator</h1>
          <p className="text-sm text-gray-500">Create Step-by-Step Drawing Tutorials Instantly</p>
        </div>
      </div>
    </header>
  );
};
