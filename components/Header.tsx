
import React from 'react';
import { ArrowLeftIcon, RefreshCwIcon, ReceiptIcon } from './icons/Icons';
import { AppStep } from '../types';

interface HeaderProps {
  step: AppStep;
  onBack: () => void;
  onRestart: () => void;
}

const titles: Record<AppStep, string> = {
  [AppStep.GuestSetup]: 'Split The Bill',
  [AppStep.ReceiptCapture]: 'Scan Receipt',
  [AppStep.ItemAssignment]: 'Assign Items & Split',
};

export const Header: React.FC<HeaderProps> = ({ step, onBack, onRestart }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-slate-800 rounded-xl shadow-lg">
      <div className="flex items-center gap-4">
        {step !== AppStep.GuestSetup ? (
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        ) : (
           <ReceiptIcon className="w-8 h-8 text-cyan-400"/>
        )}
        <h1 className="text-2xl font-bold text-white tracking-tight">{titles[step]}</h1>
      </div>
      {step !== AppStep.GuestSetup && (
        <button onClick={onRestart} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
          <RefreshCwIcon className="w-6 h-6" />
        </button>
      )}
    </header>
  );
};
