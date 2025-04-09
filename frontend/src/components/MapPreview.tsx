import { useState, useEffect, useRef } from 'react';

interface MapPreviewProps {
  location: string;
  coordinates?: { lat: number; lng: number } | null;
  height?: string;
}

declare global {
  interface Window {
    google: any;
    initMapPreviews: () => void;
    mapPreviewsInitialized: boolean;
  }
}

let mapsScriptLoaded = false;

const MapPreview: React.FC<MapPreviewProps> = ({ 
  location, 
  coordinates, 
  height = '120px' 
}) => {
  const [loaded, setLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  // Load Google Maps API script if not already loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      setLoaded(true);
      return;
    }
    
    if (!mapsScriptLoaded) {
      mapsScriptLoaded = true;
      
      // Define initialization function
      window.initMapPreviews = () => {
        window.mapPreviewsInitialized = true;
        setLoaded(true);
      };
      
      // Create script tag
      const script = document.createElement('script');
      // Replace YOUR_API_KEY with your actual Google Maps API key
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCnDVEM91hoAuvx8pEYSU6lOmHlG-vft5s&callback=initMapPreviews`;
      script.async = true;
      script.defer = true;
      
      document.head.appendChild(script);
    } else if (window.mapPreviewsInitialized) {
      // If script is loading but already initialized
      setLoaded(true);
    }
  }, []);
  
  // Initialize map when the API is loaded
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    
    const initializeMap = async () => {
      // If we have coordinates, use them directly
      if (coordinates) {
        renderMap(coordinates);
      } 
      // Otherwise, geocode the location string
      else if (location) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: location }, (results: any, status: string) => {
            if (status === 'OK' && results[0]) {
              const coords = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
              };
              renderMap(coords);
            } else {
              // Fallback to a default location if geocoding fails
              renderMap({ lat: 28.5383, lng: -81.3792 }); // Orlando, FL
            }
          });
        } catch (error) {
          console.error('Error geocoding location:', error);
          // Fallback to a default location
          renderMap({ lat: 28.5383, lng: -81.3792 }); // Orlando, FL
        }
      }
    };
    
    const renderMap = (coords: { lat: number; lng: number }) => {
      // Create map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: coords,
        zoom: 15,
        disableDefaultUI: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      // Create marker
      markerRef.current = new window.google.maps.Marker({
        map: mapInstanceRef.current,
        position: coords,
        animation: window.google.maps.Animation.DROP
      });
    };
    
    initializeMap();
    
    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        // Not strictly necessary in React but good practice
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, [loaded, location, coordinates]);
  
  const handleMapClick = () => {
    // Open in Google Maps when clicked
    const query = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };
  
  return (
    <div 
      ref={mapRef} 
      className="map-preview" 
      style={{ 
        height, 
        width: '100%', 
        backgroundColor: '#eee',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={handleMapClick}
    >
      {!loaded && (
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          Loading map...
        </div>
      )}
      
      <div 
        style={{
          position: 'absolute',
          bottom: '5px',
          right: '5px',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '2px 5px',
          borderRadius: '3px',
          fontSize: '10px',
          color: '#333'
        }}
      >
        View on Google Maps
      </div>
    </div>
  );
};

export default MapPreview;