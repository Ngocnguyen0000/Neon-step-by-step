
import React from 'react';
import type { DrawingData } from '../types';
import { StepCard } from './StepCard';

interface StepGridProps {
  data: DrawingData;
  slug: string;
}

export const StepGrid: React.FC<StepGridProps> = ({ data, slug }) => {
  const { viewBox, paths } = data;

  return (
    <div className="w-full">
       <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">Drawing Steps</h2>
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {paths.map((_, index) => {
          const stepNumber = index + 1;
          const stepPaths = paths.slice(0, stepNumber);
          return (
            <StepCard
              key={stepNumber}
              stepNumber={stepNumber}
              viewBox={viewBox}
              paths={stepPaths}
              slug={slug}
            />
          );
        })}
      </div>
    </div>
  );
};
