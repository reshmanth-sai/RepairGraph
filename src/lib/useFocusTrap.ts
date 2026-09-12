import React, { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  disableFocusTrap?: boolean;
}

/**
 * Reusable zero-dependency focus-trap hook for modal dialogs and drawers.
 * Moves focus inside on open, traps Tab & Shift+Tab within the container,
 * handles Escape to close, and restores focus to the triggering element on close.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  initialFocusRef,
  disableFocusTrap = false,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        // Modal just closed: restore focus to previous trigger element
        previousFocusRef.current?.focus();
        wasOpenRef.current = false;
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Helper to query focusable elements within container
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');
      const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
      return elements.filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);
    };

    // If modal just opened (transition from closed to open)
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      if (typeof document !== 'undefined') {
        const currentActive = document.activeElement as HTMLElement;
        if (!container.contains(currentActive)) {
          previousFocusRef.current = currentActive;
        }
      }

      // Move focus into the dialog upon opening if focus is outside
      if (typeof document !== 'undefined' && !container.contains(document.activeElement)) {
        const focusable = getFocusableElements();
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          if (!container.hasAttribute('tabindex')) {
            container.setAttribute('tabindex', '-1');
          }
          container.focus();
        }
      }
    }

    if (disableFocusTrap) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element or outside, wrap to last
          if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element or outside, wrap to first
          if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, disableFocusTrap, initialFocusRef]);

  // Clean up focus when component unmounts while modal is open
  useEffect(() => {
    return () => {
      if (wasOpenRef.current) {
        previousFocusRef.current?.focus();
      }
    };
  }, []);

  return containerRef;
}

