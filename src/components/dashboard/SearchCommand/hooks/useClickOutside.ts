import { useEffect, useRef } from 'react';

/**
 * Hook to detect clicks outside a given DOM element
 * 
 * Useful for closing modals, dropdowns, and popovers when clicking outside.
 * Listens to mousedown events and triggers callback if click is outside the element.
 * 
 * @param ref - React ref pointing to the element to detect outside clicks from
 * @param callback - Function to call when a click is detected outside the element
 * 
 * @example
 * const modalRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(true);
 * 
 * useClickOutside(modalRef, () => setIsOpen(false));
 * 
 * return (
 *   <div ref={modalRef}>
 *     Modal content here
 *   </div>
 * );
 */
export const useClickOutside = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
    useEffect(() => {
        // Click outside to close
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [callback, ref]);
};
