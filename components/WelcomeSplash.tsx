
import React from 'react';
import { PencilIcon } from './icons';

export const WelcomeSplash: React.FC = () => {
  return (
    <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="flex justify-center items-center mb-4">
        <PencilIcon className="h-12 w-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700">Let's start drawing!</h2>
      <p className="mt-2 text-gray-500">
        Enter a description of what you'd like to draw above, and the AI will generate a step-by-step guide.
      </p>
      <p className="mt-1 text-sm text-gray-400">
        For example: "a simple cat", "a cartoon rocket ship", or "a flower".
      </p>
    </div>
  );
};
