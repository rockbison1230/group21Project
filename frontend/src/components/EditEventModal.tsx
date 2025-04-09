import { useState, useEffect } from 'react';
import './CreateEventModal.css'; // Reuse same CSS
import LocationPicker from './LocationPicker';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  eventId: string;
  eventDetails: {
    EventName: string;
    Date: string;
    Time: string;
    Location: string;
    Description?: string;
    Image?: string;
    Coordinates?: { lat: number; lng: number };
  };
}

interface Coordinates {
  lat: number;
  lng: number;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ 
  isOpen, 
  onClose, 
  onEventUpdated,
  eventId,
  eventDetails
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const app_name = '167.172.31.171';

  function buildPath(route: string): string {
    if (import.meta.env.MODE !== 'development') {
      return 'http://' + app_name + ':5001/' + route;
    } else {
      return 'http://localhost:5001/' + route;
    }
  }

  // Load existing event details when modal opens
  useEffect(() => {
    if (isOpen && eventDetails) {
      setTitle(eventDetails.EventName || '');
      setDate(eventDetails.Date || '');
      setTime(eventDetails.Time || '');
      setLocation(eventDetails.Location || '');
      setDescription(eventDetails.Description || '');
      setImage(eventDetails.Image || '');
      
      // Set coordinates if available in eventDetails
      if (eventDetails.Coordinates) {
        setCoordinates(eventDetails.Coordinates);
      } else {
        setCoordinates(null);
      }
    }
  }, [isOpen, eventDetails]);

  const handleLocationChange = (locationValue: string, coords?: Coordinates) => {
    setLocation(locationValue);
    if (coords) {
      setCoordinates(coords);
    } else {
      setCoordinates(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!title || !date || !time || !location) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(buildPath('api/updateEvent'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          title,
          date,
          time,
          location,
          coordinates: coordinates || undefined, // Include coordinates if available
          description,
          image
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        // Close modal and refresh events
        onEventUpdated();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Event</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form className="event-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Event Title*</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date*</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Time*</label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group location-group">
            <label htmlFor="location">Location*</label>
            <LocationPicker 
              initialValue={location}
              onChange={handleLocationChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Image URL</label>
            <input
              id="image"
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Enter image URL (optional)"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;