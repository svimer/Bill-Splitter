
import React, { useState, useCallback } from 'react';
import type { Guest, ReceiptItem } from './types';
import { AppStep } from './types';
import GuestSetup from './components/GuestSetup';
import ReceiptCapture from './components/ReceiptCapture';
import ItemAssignment from './components/ItemAssignment';
import { parseReceipt } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { Header } from './components/Header';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.GuestSetup);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestsSet = (newGuests: Guest[]) => {
    setGuests(newGuests);
    setStep(AppStep.ReceiptCapture);
  };

  const handleReceiptCapture = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setReceiptItems(null);
    try {
      const base64 = await fileToBase64(file);
      setReceiptImage(base64);
      setStep(AppStep.ItemAssignment);
      const items = await parseReceipt(base64);
      setReceiptItems(items.map(item => ({ ...item, id: self.crypto.randomUUID() })));
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to parse receipt. Please try again. ${errorMessage}`);
      setStep(AppStep.ReceiptCapture); // Go back to capture screen on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setStep(AppStep.GuestSetup);
    setGuests([]);
    setReceiptImage(null);
    setReceiptItems(null);
    setIsLoading(false);
    setError(null);
  };

  const handleGoBack = () => {
    if (step === AppStep.ItemAssignment) {
      setStep(AppStep.ReceiptCapture);
      setReceiptItems(null);
      setReceiptImage(null);
      setError(null);
    } else if (step === AppStep.ReceiptCapture) {
      setStep(AppStep.GuestSetup);
    }
  };

  const renderStep = () => {
    switch (step) {
      case AppStep.GuestSetup:
        return <GuestSetup onGuestsSet={handleGuestsSet} />;
      case AppStep.ReceiptCapture:
        return <ReceiptCapture onReceiptCapture={handleReceiptCapture} />;
      case AppStep.ItemAssignment:
        return (
          <ItemAssignment
            guests={guests}
            initialItems={receiptItems}
            isLoading={isLoading}
            error={error}
            receiptImage={receiptImage}
            onRestart={handleReset}
          />
        );
      default:
        return <GuestSetup onGuestsSet={handleGuestsSet} />;
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased">
      <div className="container mx-auto max-w-2xl p-4">
        <Header step={step} onBack={handleGoBack} onRestart={handleReset} />
        <main className="mt-6">
          {renderStep()}
        </main>
      </div>
    </div>
  );
};

export default App;
