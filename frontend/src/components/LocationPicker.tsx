import { useState, useEffect, useRef } from 'react';
import './LocationPicker.css';

interface LocationPickerProps {
  initialValue?: string;
  onChange: (location: string, coordinates?: {lat: number, lng: number}) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const LocationPicker: React.FC<LocationPickerProps> = ({ initialValue = '', onChange }) => {
  const [location, setLocation] = useState(initialValue);
  const [, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  // Load Google Maps API script with improved approach
  useEffect(() => {
    // Define the callback function first
    window.initMap = () => {
      setMapLoaded(true);
    };
    
    // Check if script is already loaded or loading
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }
    
    // Check if the script tag already exists to avoid duplicates
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      return;
    }
    
    // Create and append the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCnDVEM91hoAuvx8pEYSU6lOmHlG-vft5s&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Google Maps script failed to load');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup callback - use an empty function instead of undefined
      window.initMap = () => {
        // Empty function as placeholder
        console.log('Map initialization function replaced');
      };
      // Don't remove the script on unmount as it might be used by other components
    };
  }, []);
  
  // Initialize autocomplete and map when the API is loaded
  useEffect(() => {
    if (!mapLoaded || !inputRef.current || !mapRef.current) return;
    
    try {
      // Initialize autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
      });
      
      // Set default map center (you can change this)
      const defaultLocation = { lat: 28.5383, lng: -81.3792 }; // Orlando, FL
      
      // Create map
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      
      // Create marker
      markerRef.current = new window.google.maps.Marker({
        map: googleMapRef.current,
        position: defaultLocation,
        visible: false,
      });
      
      // Add place_changed event listener
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry) return;
        
        // Update location name
        const locationName = place.formatted_address || place.name;
        setLocation(locationName);
        
        // Update coordinates
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setCoordinates(coords);
        
        // Update map and marker
        googleMapRef.current.setCenter(coords);
        markerRef.current.setPosition(coords);
        markerRef.current.setVisible(true);
        
        // Call the onChange callback
        onChange(locationName, coords);
      });
      
      // If there's an initial value, try to geocode it
      if (initialValue) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: initialValue }, (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            const coords = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng()
            };
            setCoordinates(coords);
            
            // Update map and marker
            googleMapRef.current.setCenter(coords);
            markerRef.current.setPosition(coords);
            markerRef.current.setVisible(true);
          }
        });
      }
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      // Provide fallback behavior or show an error message
    }
  }, [mapLoaded, initialValue, onChange]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    
    // If input is cleared, hide marker and reset coordinates
    if (!value) {
      if (markerRef.current) {
        markerRef.current.setVisible(false);
      }
      setCoordinates(null);
      onChange('', undefined);
    } else {
      // Always update with at least the text value
      onChange(value);
    }
  };
  
  return (
    <div className="location-picker">
      <div className="location-input">
        <input
          ref={inputRef}
          type="text"
          value={location}
          onChange={handleInputChange}
          placeholder="Enter event location"
          className="location-input-field"
        />
      </div>
      <div 
        ref={mapRef} 
        className={`location-map ${mapLoaded ? 'loaded' : 'loading'}`}
      >
        {!mapLoaded && <div className="map-loading">Loading map...</div>}
      </div>
    </div>
  );
};

export default LocationPicker;