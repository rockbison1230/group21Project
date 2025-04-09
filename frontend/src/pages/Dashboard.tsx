import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateEventModal from '../components/CreateEventModal';
import GuestManagementModal from '../components/GuestManagementModal';
import EditEventModal from '../components/EditEventModal'; // Import the new component
import './Dashboard.css';
import logoImage from '/images/coffee_bean.png'; 

// Types
interface Event {
  _id: string;
  EventName: string;
  Date: string;
  Time: string;
  Location: string;
  Image?: string;
  Description?: string;
  Guests?: Array<{
    _id: string;
    FirstName: string;
    LastName: string;
    Email: string;
    Status: string | number;
  }>;
}

const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dropdownStates, setDropdownStates] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();

  const app_name = '167.172.31.171';

  function buildPath(route: string): string {
    if (import.meta.env.MODE !== 'development') {
      return 'http://' + app_name + ':5001/' + route;
    } else {
      return 'http://localhost:5001/' + route;
    }
  }

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user_data');
    if (!userStr) {
      // Redirect to login if no user
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    // Fetch user's events
    fetchEvents(userData.id);
  }, [navigate]);

  // Add this effect to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (document.querySelector('.dropdown-menu') && 
          !(event.target as HTMLElement).closest('.actions-dropdown')) {
        setDropdownStates({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const fetchEvents = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(buildPath('api/getUserEvents'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      
      // If there are events, set them to state
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(buildPath('api/deleteEvent'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, userId: user?.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Remove event from state
      setEvents(events.filter(event => event._id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleSendInvites = async (eventId: string) => {
    try {
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

      alert('Invites sent successfully!');
    } catch (error) {
      console.error('Error sending invites:', error);
      alert('Failed to send invites. Please check server logs for details.');
    }
  };

  // New function to open the edit modal
  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const openGuestModal = (event: Event) => {
    setSelectedEvent(event);
    setShowGuestModal(true);
  };

  const handleEventCreated = () => {
    // Refresh events after creation
    if (user) {
      fetchEvents(user.id);
    }
  };

  const handleGuestAdded = () => {
    // Refresh events after guest added to update counts
    if (user) {
      fetchEvents(user.id);
    }
  };

  // Filter events based on search term
  const filteredEvents = events.filter(event => 
    event.EventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.Location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.Description && event.Description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    try {
      // Handle various time formats
      let timeParts;
      if (timeStr.includes(':')) {
        timeParts = timeStr.split(':');
      } else {
        return timeStr;
      }
      
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1].padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM
      
      return `${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };



  const getGuestCounts = (event: Event) => {
    const guestCount = event.Guests?.length || 0;
    
    // Improved status check that handles all possible attendance status formats
    const attendingCount = event.Guests?.filter(g => {
      // Check numeric values
      if (g.Status === 1 || g.Status === '1') return true;
      
      // Check string values (case insensitive)
      if (typeof g.Status === 'string') {
        const status = g.Status.toLowerCase();
        return status === 'attending' || status === '1' || status === 'true';
      }
      
      return false;
    }).length || 0;
    
    return { guestCount, attendingCount };
  };
  


useEffect(() => {
  // Get user from localStorage
  const userStr = localStorage.getItem('user_data');
  if (!userStr) {
    // Redirect to login if no user
    navigate('/login');
    return;
  }

  const userData = JSON.parse(userStr);
  setUser(userData);

  // Fetch user's events
  fetchEvents(userData.id);
    
  // Clean up on unmount
}, [navigate]);

  if (loading) {
    return (
      <div className="improved-dashboard">
        <div>
          <div className="brand">
            <img src={logoImage} alt="Espresso Events Logo" className="logo" />
            <h1>Espresso Events</h1>
          </div>
          <div className="user-nav">
            <span>Loading...</span>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="improved-dashboard">
      <div className="background-texture"></div>
    <div className="dashboard-header">
      <div className="brand">
        <img src={logoImage} alt="Espresso Events Logo" className="logo" />
        <h1>Espresso Events</h1>
      </div>
      
      <div className="user-nav">
        {user && (
          <>
            <span className="welcome-text">Welcome, {user.firstName}!</span>
            <button 
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem('user_data');
                navigate('/login');
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>

      <div className="dashboard-content">
        <div className="actions-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button 
            className="create-event-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Event
          </button>
        </div>

        <div className="events-section">
          {filteredEvents.length === 0 ? (
            <div className="no-events-container">
              <div className="no-events-content">
                <h2>No events found</h2>
                <p>Create your first event to get started!</p>
                <button 
                  className="create-event-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Event
                </button>
              </div>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map((event) => {
                const { guestCount, attendingCount } = getGuestCounts(event);
                const isPastEvent = new Date(`${event.Date} ${event.Time}`) < new Date();
                
                return (
                  <div 
                    key={event._id} 
                    className={`event-card ${isPastEvent ? 'past-event' : ''}`}
                  >
                    <div 
                      className="event-image" 
                      style={{ 
                        backgroundImage: event.Image 
                          ? `url(${event.Image})` 
                          : 'linear-gradient(135deg, #6F4F37 0%, #A67C52 100%)' 
                      }}
                    >
                      <div className="event-date-tag">
                        {formatDate(event.Date)}
                      </div>
                    </div>
                    
                    <div className="event-details">
                      <h3 className="event-title">{event.EventName}</h3>
                      
                      <div className="event-info">
                        <div className="info-item">
                          <span className="icon">⏰</span>
                          <span>{formatTime(event.Time)}</span>
                        </div>
                        
                        <div className="info-item">
                          <span className="icon">📍</span>
                          <span>{event.Location}</span>
                        </div>
                      </div>
                      
                      <div className="event-stats">
                        <div className="stat-item">
                          <span className="stat-count">{guestCount}</span>
                          <span className="stat-label">guests</span>
                        </div>
                        
                        <div className="stat-item">
                          <span className="stat-count">{attendingCount}</span>
                          <span className="stat-label">attending</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="event-actions">
                      <button 
                        className="view-btn"
                        onClick={() => openGuestModal(event)}
                      >
                        Manage Guests
                      </button>
                      
                      <div className="actions-dropdown">
                        <button 
                          className="dropdown-toggle" 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle the dropdown for this specific event
                            const newState = {...dropdownStates};
                            newState[event._id] = !newState[event._id];
                            setDropdownStates(newState);
                          }}
                        >
                          •••
                        </button>
                        {dropdownStates[event._id] && (
                          <div className="dropdown-menu">
                            <button onClick={() => {
                              handleSendInvites(event._id);
                              // Keep the menu open after clicking
                            }}>
                              Send Invites
                            </button>
                            <button onClick={() => {
                              openEditModal(event);
                              // Close dropdown after clicking edit
                              const newState = {...dropdownStates};
                              newState[event._id] = false;
                              setDropdownStates(newState);
                            }}>
                              Edit Event
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => {
                                handleDeleteEvent(event._id);
                                // Close dropdown after clicking delete
                                const newState = {...dropdownStates};
                                newState[event._id] = false;
                                setDropdownStates(newState);
                              }}
                            >
                              Delete Event
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEventModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onEventCreated={handleEventCreated}
          userId={user?.id}
        />
      )}

      {showGuestModal && selectedEvent && (
        <GuestManagementModal 
          isOpen={showGuestModal}
          onClose={() => setShowGuestModal(false)}
          eventId={selectedEvent._id}
          eventName={selectedEvent.EventName}
          onGuestAdded={handleGuestAdded}
        />
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <EditEventModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onEventUpdated={handleEventCreated}
          eventId={selectedEvent._id}
          eventDetails={{
            EventName: selectedEvent.EventName,
            Date: selectedEvent.Date,
            Time: selectedEvent.Time,
            Location: selectedEvent.Location,
            Description: selectedEvent.Description,
            Image: selectedEvent.Image
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;