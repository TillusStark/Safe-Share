
import { useEffect, RefObject } from 'react';

export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      // Check if the click was inside the element or if the ref is not attached
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      
      handler(event);
    };
    
    // Add event listeners
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    // Clean up listeners on unmount
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
