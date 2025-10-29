import React, { useState, useMemo, useCallback } from 'react';
import type { Guest, ReceiptItem, Assignment } from '../types';
import { SpinnerIcon, PlusIcon, MinusIcon, AlertTriangleIcon, CheckCircleIcon, ShareIcon } from './icons/Icons';

interface ItemAssignmentProps {
  guests: Guest[];
  initialItems: ReceiptItem[] | null;
  isLoading: boolean;
  error: string | null;
  receiptImage: string | null;
  onRestart: () => void;
}

const ItemAssignment: React.FC<ItemAssignmentProps> = ({ guests, initialItems, isLoading, error, receiptImage, onRestart }) => {
  const [assignments, setAssignments] = useState<Assignment>({});
  const [serviceFee, setServiceFee] = useState(10);
  const [isEvenSplitMode, setIsEvenSplitMode] = useState<Record<string, boolean>>({});
  const [evenSplitSelections, setEvenSplitSelections] = useState<Record<string, Set<string>>>({});

  const isShareSupported = useMemo(() => typeof navigator !== 'undefined' && !!navigator.share, []);

  const getAssignedCount = useCallback((itemId: string) => {
    return Object.values(assignments[itemId] || {}).reduce((sum: number, count: number) => sum + count, 0);
  }, [assignments]);
  
  const handleAssign = (itemId: string, guestId: string, change: number) => {
    const item = initialItems?.find(i => i.id === itemId);
    if (!item) return;

    setAssignments(prev => {
      const currentCount = prev[itemId]?.[guestId] || 0;
      let newCount = currentCount + change;

      const totalAssigned = getAssignedCount(itemId) - currentCount;

      if (newCount < 0) newCount = 0;
      if (totalAssigned + newCount > item.quantity) {
        newCount = item.quantity - totalAssigned;
      }
      
      const newAssignmentsForItem = {
        ...(prev[itemId] || {}),
        [guestId]: newCount,
      };
      
      if (newAssignmentsForItem[guestId] === 0) {
        delete newAssignmentsForItem[guestId];
      }

      return {
        ...prev,
        [itemId]: newAssignmentsForItem,
      };
    });
  };

  const handleToggleEvenSplit = useCallback((itemId: string) => {
    const isEnteringEvenSplit = !isEvenSplitMode[itemId];

    setIsEvenSplitMode(prev => ({ ...prev, [itemId]: isEnteringEvenSplit }));

    setAssignments(prev => {
        const newAssignments = { ...prev };
        if (newAssignments[itemId]) {
            delete newAssignments[itemId];
        }
        return newAssignments;
    });

    if (isEnteringEvenSplit) {
        setEvenSplitSelections(prev => ({ ...prev, [itemId]: new Set() }));
    } else {
        setEvenSplitSelections(prev => {
            const newSelections = { ...prev };
            if (newSelections[itemId]) {
                delete newSelections[itemId];
            }
            return newSelections;
        });
    }
  }, [isEvenSplitMode]);

  const handleEvenSplitGuestToggle = useCallback((itemId: string, guestId: string) => {
    const item = initialItems?.find(i => i.id === itemId);
    if (!item) return;

    const newSelections = new Set(evenSplitSelections[itemId] || []);
    if (newSelections.has(guestId)) {
        newSelections.delete(guestId);
    } else {
        newSelections.add(guestId);
    }
    setEvenSplitSelections(prev => ({ ...prev, [itemId]: newSelections }));
    
    const sharersCount = newSelections.size;
    const newAssignmentsForItem: { [guestId: string]: number } = {};

    if (sharersCount > 0) {
        const quantityPerGuest = item.quantity / sharersCount;
        newSelections.forEach(id => {
            newAssignmentsForItem[id] = quantityPerGuest;
        });
    }

    setAssignments(prev => ({
        ...prev,
        [itemId]: newAssignmentsForItem,
    }));
  }, [initialItems, evenSplitSelections]);


  const totals = useMemo(() => {
    const guestTotals: { [guestId: string]: { subtotal: number, fee: number, total: number } } = {};
    guests.forEach(guest => {
      guestTotals[guest.id] = { subtotal: 0, fee: 0, total: 0 };
    });

    let billSubtotal = 0;

    if (initialItems) {
      initialItems.forEach(item => {
        const unitPrice = item.price / item.quantity;
        billSubtotal += item.price;

        const itemAssignments = assignments[item.id] || {};
        // FIX: Use Object.keys to ensure guestId is a string and quantity is a number, preventing type errors.
        Object.keys(itemAssignments).forEach(guestId => {
          if (guestTotals[guestId]) {
            const quantity = itemAssignments[guestId];
            guestTotals[guestId].subtotal += unitPrice * quantity;
          }
        });
      });
    }
    
    const totalServiceFee = billSubtotal * (Number(serviceFee) / 100);

    guests.forEach(guest => {
      const guestSubtotal = guestTotals[guest.id].subtotal;
      const feeShare = billSubtotal > 0 ? (guestSubtotal / billSubtotal) * totalServiceFee : 0;
      guestTotals[guest.id].fee = feeShare;
      guestTotals[guest.id].total = guestSubtotal + feeShare;
    });

    return { guestTotals, billSubtotal, totalServiceFee, grandTotal: billSubtotal + totalServiceFee };

  }, [guests, initialItems, assignments, serviceFee]);
  
  const allItemsAssigned = useMemo(() => {
    if (!initialItems) return false;
    return initialItems.every(item => Math.abs(getAssignedCount(item.id) - item.quantity) < 0.001);
  }, [initialItems, getAssignedCount]);

  const handleShareSummary = useCallback(async () => {
    if (!isShareSupported) {
      alert("Sharing is not supported on this browser.");
      return;
    }

    const guestLines = guests.map(guest => {
      const guestTotal = totals.guestTotals[guest.id]?.total.toFixed(2) || '0.00';
      return `- ${guest.name}: ${guestTotal}`;
    }).join('\n');

    const summaryText = `🧾 Bill Summary 🧾\n\n${guestLines}\n\n---\nSubtotal: ${totals.billSubtotal.toFixed(2)}\nService Fee (${serviceFee}%): ${totals.totalServiceFee.toFixed(2)}\nGrand Total: ${totals.grandTotal.toFixed(2)}`;

    try {
      await navigator.share({
        title: 'Bill Summary',
        text: summaryText,
      });
    } catch (error) {
      console.error('Error sharing summary:', error);
    }
  }, [isShareSupported, guests, totals, serviceFee]);

  const handleShareIndividual = useCallback(async (guestId: string) => {
    if (!isShareSupported) {
      alert("Sharing is not supported on this browser.");
      return;
    }

    const guest = guests.find(g => g.id === guestId);
    if (!guest || !initialItems) return;

    const guestData = totals.guestTotals[guestId];
    if (!guestData) return;

    const itemLines = initialItems.map(item => {
      const assignedQty = assignments[item.id]?.[guestId] || 0;
      if (assignedQty === 0) return null;
      
      const unitPrice = item.price / item.quantity;
      const itemTotal = unitPrice * assignedQty;

      const quantityDisplay = Number.isInteger(assignedQty) ? assignedQty : assignedQty.toFixed(2);
      
      return `- ${quantityDisplay} x ${item.description}: ${itemTotal.toFixed(2)}`;
    }).filter(Boolean).join('\n');

    const individualText = `Hi ${guest.name}! 👋\n\nHere's your share of the bill:\n\nItems:\n${itemLines || 'No items assigned.'}\n\n---\nSubtotal: ${guestData.subtotal.toFixed(2)}\nService Fee: ${guestData.fee.toFixed(2)}\nYour Total: ${guestData.total.toFixed(2)}`;

    try {
      await navigator.share({
        title: `Your Bill, ${guest.name}`,
        text: individualText,
      });
    } catch (error) {
      console.error(`Error sharing with ${guest.name}:`, error);
    }
  }, [isShareSupported, guests, initialItems, totals, assignments]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-800 rounded-xl">
        <SpinnerIcon className="w-16 h-16 text-cyan-400" />
        <h3 className="mt-4 text-2xl font-bold">Scanning Receipt...</h3>
        <p className="text-slate-400">Our AI is hard at work reading your bill.</p>
        {receiptImage && <img src={`data:image/jpeg;base64,${receiptImage}`} alt="receipt" className="mt-4 rounded-lg max-h-64 shadow-lg opacity-50" />}
      </div>
    );
  }

  if (error) {
    return (
       <div className="flex flex-col items-center justify-center p-8 text-center bg-red-900/20 border border-red-500 rounded-xl">
        <AlertTriangleIcon className="w-16 h-16 text-red-400" />
        <h3 className="mt-4 text-2xl font-bold text-red-300">Scan Failed</h3>
        <p className="mt-2 text-red-400 max-w-md">{error}</p>
         <button 
            onClick={onRestart}
            className="mt-6 px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
            Try Again
        </button>
      </div>
    );
  }

  if (!initialItems) {
    return <div className="text-center p-8">No items were found on the receipt.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Item List */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 space-y-4">
            <h3 className="text-xl font-bold border-b border-slate-700 pb-2">Assign Items</h3>
            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
            {initialItems.map(item => {
                const assignedCount = getAssignedCount(item.id);
                const isItemFullyAssigned = Math.abs(assignedCount - item.quantity) < 0.001;
                const isEvenSplit = !!isEvenSplitMode[item.id];

                return (
                <div key={item.id} className={`p-4 rounded-lg transition-all ${isItemFullyAssigned ? 'bg-green-900/20' : 'bg-slate-900'}`}>
                    <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-lg">{item.description}</p>
                        <p className="text-sm text-slate-400">
                        {item.quantity} x {(item.price / item.quantity).toFixed(2)} = {item.price.toFixed(2)}
                        </p>
                    </div>
                    <div className={`px-3 py-1 text-sm rounded-full font-medium ${isItemFullyAssigned ? 'bg-green-500 text-green-950' : 'bg-slate-700 text-slate-300'}`}>
                        {assignedCount.toFixed(2)} / {item.quantity} assigned
                    </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={`even-split-${item.id}`}
                            checked={isEvenSplit}
                            onChange={() => handleToggleEvenSplit(item.id)}
                            className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-600"
                        />
                        <label htmlFor={`even-split-${item.id}`} className="text-sm font-medium text-slate-300">
                            Разделить поровну
                        </label>
                    </div>

                    <div className="mt-3">
                        {isEvenSplit ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {guests.map(guest => {
                                    const isSelected = evenSplitSelections[item.id]?.has(guest.id);
                                    return (
                                        <div key={guest.id}>
                                            <input
                                                type="checkbox"
                                                id={`assign-${item.id}-${guest.id}`}
                                                checked={!!isSelected}
                                                onChange={() => handleEvenSplitGuestToggle(item.id, guest.id)}
                                                className="hidden peer"
                                            />
                                            <label
                                                htmlFor={`assign-${item.id}-${guest.id}`}
                                                className={`block w-full text-center text-sm font-medium p-2 rounded-md transition-colors cursor-pointer ${
                                                    isSelected 
                                                    ? 'bg-cyan-600 text-white' 
                                                    : 'bg-slate-800 hover:bg-slate-700'
                                                }`}
                                            >
                                                {guest.name}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {guests.map(guest => (
                                    <div key={guest.id} className="flex items-center justify-between bg-slate-800 rounded-md p-2">
                                    <span className="text-sm font-medium truncate pr-2">{guest.name}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleAssign(item.id, guest.id, -1)} className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 transition disabled:opacity-50" disabled={(assignments[item.id]?.[guest.id] || 0) === 0}>
                                        <MinusIcon className="w-4 h-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold">{assignments[item.id]?.[guest.id] || 0}</span>
                                        <button onClick={() => handleAssign(item.id, guest.id, 1)} className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 transition disabled:opacity-50" disabled={isItemFullyAssigned}>
                                        <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                );
            })}
            </div>
        </div>

        {/* Service Fee & Summary */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 space-y-4">
            <h3 className="text-xl font-bold border-b border-slate-700 pb-2">Final Bill</h3>
            
            {/* Service Fee */}
            <div>
                <label htmlFor="service-fee" className="block text-sm font-medium text-slate-300">Service Fee / Tip (%)</label>
                <input
                    type="number"
                    id="service-fee"
                    value={serviceFee}
                    onChange={e => setServiceFee(Math.max(0, parseInt(e.target.value) || 0))}
                    className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
            </div>
            
            {!allItemsAssigned && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-500 rounded-lg flex items-center gap-3">
                    <AlertTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <p className="text-sm text-yellow-300">There are still unassigned items. The bill total may not be accurate.</p>
                </div>
            )}
             {allItemsAssigned && (
                <div className="p-3 bg-green-900/20 border border-green-500 rounded-lg flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-300">All items assigned! Ready to settle up.</p>
                </div>
            )}

            {/* Totals Breakdown */}
            <div className="space-y-3 pt-2">
                {guests.map(guest => (
                <div key={guest.id} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                    <div>
                        <span className="font-semibold">{guest.name}</span>
                        <p className="text-xs text-slate-400">
                            Subtotal: {totals.guestTotals[guest.id].subtotal.toFixed(2)} + Fee: {totals.guestTotals[guest.id].fee.toFixed(2)}
                        </p>
                    </div>
                     <div className="flex items-center gap-2 sm:gap-4">
                        <p className="text-xl font-bold text-right">{totals.guestTotals[guest.id].total.toFixed(2)}</p>
                        {isShareSupported && (
                        <button 
                            onClick={() => handleShareIndividual(guest.id)} 
                            className="p-2 rounded-full hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!allItemsAssigned || totals.guestTotals[guest.id].total === 0}
                            aria-label={`Share bill with ${guest.name}`}
                        >
                            <ShareIcon className="w-5 h-5" />
                        </button>
                        )}
                    </div>
                </div>
                ))}
            </div>

            <div className="border-t border-slate-700 pt-4 mt-4 space-y-2 text-right">
                 <p className="text-slate-400">Subtotal: <span className="font-medium text-slate-200">{totals.billSubtotal.toFixed(2)}</span></p>
                 <p className="text-slate-400">Service Fee ({serviceFee}%): <span className="font-medium text-slate-200">{totals.totalServiceFee.toFixed(2)}</span></p>
                 <p className="text-2xl font-bold text-cyan-400">Grand Total: <span className="text-white">{totals.grandTotal.toFixed(2)}</span></p>
            </div>

            {isShareSupported && allItemsAssigned && (
                <div className="mt-6 border-t border-slate-700 pt-6">
                    <button
                    onClick={handleShareSummary}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-transform transform hover:scale-105"
                    >
                    Share Full Summary
                    <ShareIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default ItemAssignment;