
import type { DrawingData } from '../types';

/**
 * Parses an SVG string into its core components.
 * @param svgString The raw SVG content as a string.
 * @returns A structured object with viewBox and an array of path strings.
 * @throws An error if the SVG is invalid, empty, or lacks necessary elements.
 */
export const parseSvg = (svgString: string): Omit<DrawingData, 'fullSvg'> => {
  if (!svgString) {
    throw new Error('The provided SVG content is empty.');
  }
  
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  
  const parserError = svgDoc.querySelector('parsererror');
  if (parserError) {
    console.error('SVG Parser Error:', parserError.textContent);
    throw new Error('The file is not a valid SVG or could not be processed.');
  }

  const svgElement = svgDoc.querySelector('svg');
  if (!svgElement) {
    throw new Error('No <svg> element found in the provided content.');
  }
  
  const viewBox = svgElement.getAttribute('viewBox');
  if (!viewBox) {
    throw new Error('SVG is missing the required viewBox attribute.');
  }

  const pathElements = svgDoc.querySelectorAll('path');
  if (pathElements.length === 0) {
    throw new Error('SVG must contain at least one <path> element. Vectorization might have failed for this image, or the SVG is not structured as required.');
  }

  const paths = Array.from(pathElements).map(path => path.outerHTML);

  return {
    viewBox,
    paths,
  };
};

/**
 * Merge an array of SVG path element strings down to a maximum number of steps.
 * Smallest paths (by approximate "d" attribute length or overall string length) are merged first.
 * Each resulting step string may contain multiple <path> elements concatenated.
 */
export const mergePathsToMaxSteps = (paths: string[], maxSteps: number): string[] => {
  if (!Array.isArray(paths) || paths.length === 0) return [];
  if (maxSteps <= 0) return [paths.join('')];
  if (paths.length <= maxSteps) return [...paths];

  const estimateSize = (pathStr: string): number => {
    const dMatch = pathStr.match(/\sd\s*=\s*(["'])(.*?)\1/i);
    if (dMatch && typeof dMatch[2] === 'string') {
      return dMatch[2].length || pathStr.length;
    }
    return pathStr.length;
  };

  const sizes = paths.map(estimateSize);
  const totalSize = sizes.reduce((a, b) => a + b, 0);
  const targetGroupCount = Math.max(1, Math.min(maxSteps, paths.length));
  const targetGroupSize = totalSize / targetGroupCount;

  const groups: string[] = [];
  let currentContent = '';
  let currentSize = 0;
  let remainingPaths = paths.length;
  let remainingGroups = targetGroupCount;

  for (let i = 0; i < paths.length; i++) {
    currentContent += paths[i];
    currentSize += sizes[i];
    remainingPaths -= 1;

    const groupsFormed = groups.length;
    remainingGroups = targetGroupCount - groupsFormed - 1; // reserve last group

    const shouldCloseGroup = (
      groupsFormed < targetGroupCount - 1 && // keep at least one group for the tail
      currentSize >= targetGroupSize &&
      remainingPaths >= remainingGroups // ensure at least one path per remaining group
    );

    if (shouldCloseGroup) {
      groups.push(currentContent);
      currentContent = '';
      currentSize = 0;
    }
  }

  if (currentContent) groups.push(currentContent);

  // Safety: ensure we don't exceed targetGroupCount by merging extras at the end
  while (groups.length > targetGroupCount) {
    const a = groups.pop()!;
    groups[groups.length - 1] += a;
  }

  return groups;
};
