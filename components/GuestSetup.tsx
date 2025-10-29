
import React, { useState, useMemo } from 'react';
import type { Guest } from '../types';
import { UsersIcon, PlusIcon, MinusIcon, ArrowRightIcon } from './icons/Icons';

interface GuestSetupProps {
  onGuestsSet: (guests: Guest[]) => void;
}

const GuestSetup: React.FC<GuestSetupProps> = ({ onGuestsSet }) => {
  const [guestCount, setGuestCount] = useState(2);
  const [guestNames, setGuestNames] = useState<string[]>(['Guest 1', 'Guest 2']);

  const handleCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 10) return;
    setGuestCount(newCount);
    setGuestNames(prevNames => {
      const newNames = [...prevNames];
      if (newCount > prevNames.length) {
        for (let i = prevNames.length; i < newCount; i++) {
          newNames.push(`Guest ${i + 1}`);
        }
      } else {
        newNames.length = newCount;
      }
      return newNames;
    });
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...guestNames];
    newNames[index] = name;
    setGuestNames(newNames);
  };
  
  const areNamesValid = useMemo(() => {
    return guestNames.every(name => name.trim() !== '');
  }, [guestNames]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areNamesValid) return;
    const guests: Guest[] = guestNames.map(name => ({
      id: self.crypto.randomUUID(),
      name,
    }));
    onGuestsSet(guests);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-cyan-400" />
            <h2 className="mt-4 text-3xl font-extrabold text-white">Who is splitting?</h2>
            <p className="mt-2 text-slate-400">First, let's set up the party.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="guest-count" className="block text-sm font-medium text-slate-300">Number of Guests</label>
            <div className="mt-2 flex items-center justify-center gap-4">
              <button type="button" onClick={() => handleCountChange(guestCount - 1)} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50" disabled={guestCount <= 1}>
                <MinusIcon className="w-5 h-5"/>
              </button>
              <span className="text-2xl font-bold w-12 text-center">{guestCount}</span>
              <button type="button" onClick={() => handleCountChange(guestCount + 1)} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50" disabled={guestCount >= 10}>
                <PlusIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>
          
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {Array.from({ length: guestCount }).map((_, index) => (
              <div key={index}>
                <label htmlFor={`guest-name-${index}`} className="sr-only">Guest {index + 1} Name</label>
                <input
                  id={`guest-name-${index}`}
                  type="text"
                  value={guestNames[index] || ''}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  placeholder={`Guest ${index + 1} Name`}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  required
                />
              </div>
            ))}
          </div>

          <button 
            type="submit"
            disabled={!areNamesValid}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-transform transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100"
          >
            Next Step
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuestSetup;
