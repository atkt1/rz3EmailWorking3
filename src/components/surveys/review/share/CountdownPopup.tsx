import { useEffect, useState } from 'react';

interface CountdownPopupProps {
  isOpen: boolean;
  onComplete: () => void;
  timeDelay: string | number;
}

function getDelayInSeconds(timeDelay: string | number): number {
  if (!timeDelay) return 30;
  if (typeof timeDelay === 'number') return timeDelay;
  const delay = parseInt(timeDelay, 10);
  return isNaN(delay) ? 30 : delay;
}

export function CountdownPopup({ isOpen, onComplete, timeDelay }: CountdownPopupProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Initialize timer when popup opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(getDelayInSeconds(timeDelay));
    } else {
      setTimeLeft(null); // Reset when closed
    }
  }, [isOpen, timeDelay]);

  // Handle countdown
  useEffect(() => {
    if (!isOpen || timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, onComplete]);

  if (!isOpen || timeLeft === null) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl text-center">
        <div className="mb-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Waiting for you to post your review on Amazon!
        </h3>
        <p className="text-gray-600 mb-4">
          Once posted, this popup will auto close and you can share your details to get the Instant Reward!
        </p>
        <p className="text-sm text-gray-500">
          Auto-closing in {timeLeft} seconds...
        </p>
      </div>
    </div>
  );
}