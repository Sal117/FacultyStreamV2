export interface Facility {
  id: string;
  name: string;
  location: string;
  capacity: number;
  type: 'classroom' | 'meeting-room' | 'lab' | 'office';
  amenities: string[];
  status: 'available' | 'maintenance' | 'reserved';
  schedule: {
    [date: string]: {
      [timeSlot: string]: {
        isAvailable: boolean;
        appointmentId?: string;
      };
    };
  };
  createdAt: Date;
  description?: string;
}
