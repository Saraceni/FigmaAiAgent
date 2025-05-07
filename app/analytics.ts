declare global {
  interface Window {
    sa_event?: (eventName: string, options?: Record<string, any>) => void;
  }
}

/**
 * Track an event with Simple Analytics
 * @param eventName The name of the event to track
 * @param options Optional parameters for the event
 */
export const saEvent = (eventName: string, options?: Record<string, any>): void => {
  if (typeof window !== 'undefined' && window.sa_event) {
    window.sa_event(eventName, options);
  } else {
    console.warn('Simple Analytics not loaded yet or blocked');
  }
};