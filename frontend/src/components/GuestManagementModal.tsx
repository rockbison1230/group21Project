import { useState, useEffect } from 'react';
import './GuestManagementModal.css';

interface Guest {
  _id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Status: string | number;
}

interface GuestManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  onGuestAdded: () => void;
}

const GuestManagementModal: React.FC<GuestManagementModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
  onGuestAdded
}) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'

  const app_name = '167.172.31.171';

  function buildPath(route: string): string {
    if (import.meta.env.MODE !== 'development') {
      return 'http://' + app_name + ':5001/' + route;
    } else {
      return 'http://localhost:5001/' + route;
    }
  }

  useEffect(() => {
    if (isOpen && eventId) {
      fetchGuests();
    }
  }, [isOpen, eventId]);
  
  // Update the fetchGuests function to add a timeout parameter for periodic refreshing
  const fetchGuests = async (timeout = false) => {
    try {
      if (!timeout) setLoading(true);
      const response = await fetch(buildPath('api/searchContacts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, search: searchTerm }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch guests');
      }
  
      const data = await response.json();
      
      if (data.results) {
        setGuests(data.results.map((guest: any) => ({
          _id: guest.id,
          FirstName: guest.name.split(' ')[0],
          LastName: guest.name.split(' ').slice(1).join(' '),
          Email: guest.email,
          Status: guest.status
        })));
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
      if (!timeout) setError('Failed to load guest list');
    } finally {
      if (!timeout) setLoading(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !email) {
      setError('First name and email are required');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(buildPath('api/addGuest'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          firstName,
          lastName,
          email,
          status: 'pending'
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Guest added successfully');
        setFirstName('');
        setLastName('');
        setEmail('');
        fetchGuests();
        onGuestAdded();
      }
    } catch (err: any) {
      setError('Failed to add guest');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!window.confirm('Are you sure you want to remove this guest?')) {
      return;
    }

    try {
      const response = await fetch(buildPath('api/deleteContacts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactId: guestId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete guest');
      }

      // Remove from local state
      setGuests(guests.filter(guest => guest._id !== guestId));
      setSuccess('Guest removed successfully');
      // Make sure to call onGuestAdded so Dashboard updates its counts
      onGuestAdded();
    } catch (error) {
      console.error('Error deleting guest:', error);
      setError('Failed to remove guest');
    }
  };

  const handleSendInvites = async () => {
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(buildPath('api/sendGuestInvite'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invites');
      }

      setSuccess('Invite(s) sent successfully');
    } catch (error) {
      console.error('Error sending invites:', error);
      setError('Failed to send invites');
    }
  };

  const getStatusLabel = (status: string | number) => {
    if (status === 1 || status === '1' || status === 'attending') return 'Attending';
    if (status === 0 || status === '0' || status === 'declined') return 'Declined';
    return 'Pending';
  };

  const getStatusClass = (status: string | number) => {
    if (status === 1 || status === '1' || status === 'attending') return 'status-attending';
    if (status === 0 || status === '0' || status === 'declined') return 'status-declined';
    return 'status-pending';
  };

  const filteredGuests = guests.filter(guest => 
    `${guest.FirstName} ${guest.LastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content guest-modal">
        <div className="modal-header">
          <h2>Manage Guests: {eventName}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Guest List
          </button>
          <button 
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Guest
          </button>
        </div>
        
        {activeTab === 'list' && (
          <div className="guest-list-container">
            <div className="guest-list-header">
              <div className="search-box">
                <input 
                  type="text"
                  placeholder="Search guests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className="send-invites-btn"
                onClick={handleSendInvites}
              >
                Send Invites
              </button>
            </div>
            
            {loading ? (
              <div className="loading-spinner"></div>
            ) : filteredGuests.length === 0 ? (
              <div className="no-guests">
                <p>No guests found for this event</p>
              </div>
            ) : (
              <div className="guest-list">
                {filteredGuests.map(guest => (
                  <div key={guest._id} className="guest-item">
                    <div className="guest-info">
                      <div className="guest-name">
                        {guest.FirstName} {guest.LastName}
                      </div>
                      <div className="guest-email">{guest.Email}</div>
                    </div>
                    <div className="guest-status">
                      <span className={`status-badge ${getStatusClass(guest.Status)}`}>
                        {getStatusLabel(guest.Status)}
                      </span>
                      <button 
                        className="delete-guest-btn" 
                        onClick={() => handleDeleteGuest(guest._id)}
                        title="Remove Guest"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
          </div>
        )}
        
        {activeTab === 'add' && (
          <div className="add-guest-container">
            <form onSubmit={handleAddGuest}>
              <div className="form-group">
                <label htmlFor="firstName">First Name*</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address*</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Add Guest
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestManagementModal;