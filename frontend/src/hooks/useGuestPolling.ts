import { useState, useEffect, useRef } from 'react';

interface GuestData {
  eventId: string;
  guestCount: number;
  attendingCount: number;
  guests: Array<{
    _id: string;
    name: string;
    email: string;
    status: string | number;
  }>;
}

export const useGuestPolling = (buildPathFn: (route: string) => string) => {
  const [guestDataMap, setGuestDataMap] = useState<{[eventId: string]: GuestData}>({});
  const [pollingEvents, setPollingEvents] = useState<string[]>([]);
  const pollingIntervalRef = useRef<number | null>(null);
  
  // Function to fetch guest data for a specific event
  const fetchGuestData = async (eventId: string, _silent = true) => {
    try {
      // Fetch guests for this event
      const response = await fetch(buildPathFn('api/searchContacts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, search: '' })
      });
      
      if (!response.ok) throw new Error('Failed to fetch guests');
      
      const data = await response.json();
      
      if (data.results) {
        const guests = data.results.map((guest: any) => ({
          _id: guest.id,
          name: guest.name,
          email: guest.email,
          status: guest.status
        }));
        
        // Count attending guests
        const attendingCount = guests.filter((g: { status: string | number; }) => {
          if (g.status === 1 || g.status === '1') return true;
          
          if (typeof g.status === 'string') {
            const status = g.status.toLowerCase();
            return status === 'attending' || status === '1' || status === 'true';
          }
          
          return false;
        }).length;
        
        // Update guest data for this event
        setGuestDataMap(prevMap => ({
          ...prevMap,
          [eventId]: {
            eventId,
            guestCount: guests.length,
            attendingCount,
            guests
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching guest data:', error);
    }
  };
  
  // Start polling for a specific event
  const startPollingEvent = (eventId: string) => {
    if (!pollingEvents.includes(eventId)) {
      setPollingEvents(prev => [...prev, eventId]);
      fetchGuestData(eventId); // Fetch immediately once
    }
  };
  
  // Stop polling for a specific event
  const stopPollingEvent = (eventId: string) => {
    setPollingEvents(prev => prev.filter(id => id !== eventId));
  };
  
  // Clear all polling
  const clearAllPolling = () => {
    setPollingEvents([]);
  };
  
  // Set up interval for polling all active events
  useEffect(() => {
    if (pollingEvents.length > 0 && !pollingIntervalRef.current) {
      pollingIntervalRef.current = window.setInterval(() => {
        pollingEvents.forEach(eventId => {
          fetchGuestData(eventId, true);
        });
      }, 5000); // Poll every 5 seconds
    } else if (pollingEvents.length === 0 && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [pollingEvents]);
  
  return { 
    guestDataMap,
    startPollingEvent,
    stopPollingEvent,
    clearAllPolling,
    fetchGuestData
  };
};