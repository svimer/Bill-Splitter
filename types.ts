
export interface Guest {
  id: string;
  name: string;
}

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Assignment {
  [itemId: string]: {
    [guestId: string]: number;
  };
}

export enum AppStep {
  GuestSetup,
  ReceiptCapture,
  ItemAssignment,
}
