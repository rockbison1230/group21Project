import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import './Dashboard.css';

// API utility function from your login component
const app_name = '167.172.31.171';
function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development') {
    return 'http://' + app_name + ':5001/' + route;
  } else {
    return 'http://localhost:5001/' + route;
  }
}

// Event type definition
interface Contact {
  id: number;
  name: string;
  email: string;
  attending: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  description: string;
  contacts: Contact[];
}

// We'll fetch events from the API instead of using sample data

function Dashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [contactSearchTerm] = useState('');
  const [newContact, setNewContact] = useState({ name: '', email: '' });
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  // Add state for emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  // Form state for new/edit event
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    image: '📅',
    description: ''
  });

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle emoji selection
  const onEmojiClick = (emojiData: any) => {
    setEventForm(prev => ({
      ...prev,
      image: emojiData.emoji
    }));
    setShowEmojiPicker(false);
  };

  // Check for user login on component mount
  useEffect(() => {
    const checkLogin = () => {
      const userData = localStorage.getItem('user_data');
      if (!userData) {
        // Redirect to login if not logged in
        navigate('/');
        return;
      }
      
      const parsedUserData = JSON.parse(userData);
      setUserData(parsedUserData);
      
      // Fetch the user's events from the API
      fetchUserEvents(parsedUserData.id);
    };
    
    checkLogin();
  }, [navigate]);

  // Fetch user events from the API
  const fetchUserEvents = async (userId: string) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(buildPath(`api/getUserEvents`), {
        method: 'POST',
        body: JSON.stringify({ userId }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.error) {
        console.error(data.error);
        setErrorMessage('Failed to load events. Please try again.');
        setEvents([]);
        return;
      }
      
      // Transform the events from API format to our component format
      if (data.events && Array.isArray(data.events)) {
        const formattedEvents = data.events.map((event: any) => ({
          id: event._id,
          title: event.Title,
          date: event.Date,
          time: event.Time,
          location: event.Location,
          image: event.Image || '📅',
          description: event.Description || '',
          contacts: event.Contacts || []
        }));
        
        setEvents(formattedEvents);
      } else {
        // If no events are found, set an empty array
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorMessage('Error connecting to the server. Please check your connection and try again.');
      // If there's an error, we still want to show an empty events list
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events based on search term
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter contacts based on search term
  const filteredContacts = selectedEvent?.contacts.filter(contact => 
    contact.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase())
  ) || [];

  // Handle input change for event form
  const handleEventInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission for new event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (!userDataStr) return;
      
      const userData = JSON.parse(userDataStr);
      
      const eventData = {
        userId: userData.id,
        title: eventForm.title,
        date: eventForm.date,
        time: eventForm.time,
        location: eventForm.location,
        image: eventForm.image,
        description: eventForm.description
      };
      
      const response = await fetch(buildPath('api/addEvent'), {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.error) {
        console.error(data.error);
        alert(`Error adding event: ${data.error}`);
        return;
      }
      
      // Refresh events after adding
      fetchUserEvents(userData.id);
      setShowAddEventModal(false);
      
      // Reset form
      resetEventForm();
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event. Please try again.');
    }
  };

  // Handle form submission for editing event
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent) return;
    
    try {
      const eventData = {
        eventId: selectedEvent.id,
        title: eventForm.title,
        date: eventForm.date,
        time: eventForm.time,
        location: eventForm.location,
        image: eventForm.image,
        description: eventForm.description
      };
      
      const response = await fetch(buildPath('api/updateEvent'), {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.error) {
        console.error(data.error);
        alert(`Error updating event: ${data.error}`);
        return;
      }
      
      // Update local state
      const updatedEvents = events.map(event => 
        event.id === selectedEvent.id 
          ? { ...event, ...eventForm } 
          : event
      );
      
      setEvents(updatedEvents);
      
      // If details modal is open, update the selected event
      if (showDetailsModal) {
        setSelectedEvent({ ...selectedEvent, ...eventForm });
      }
      
      setShowEditEventModal(false);
      
      // Refresh events to get the latest data
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        fetchUserEvents(userData.id);
      }
      
      // Reset form
      resetEventForm();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please try again.');
    }
  };

  // Delete event function
  const handleDeleteEvent = async (id: number) => {
    if (window.confirm(`Are you sure you want to delete this event?`)) {
      try {
        const response = await fetch(buildPath('api/deleteEvent'), {
          method: 'POST',
          body: JSON.stringify({ eventId: id }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.error) {
          console.error(data.error);
          alert(`Error deleting event: ${data.error}`);
          return;
        }
        
        // Update local state
        setEvents(events.filter(event => event.id !== id));
        
        // Close modals if the deleted event was selected
        if (selectedEvent && selectedEvent.id === id) {
          setShowDetailsModal(false);
          setShowEditEventModal(false);
        }
        
        // Refresh the events list
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          fetchUserEvents(userData.id);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  // Open event details
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Add contact to event
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent) return;
    
    try {
      // Split the name into first and last name
      const nameParts = newContact.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      const contactData = {
        eventId: selectedEvent.id,
        firstName: firstName,
        lastName: lastName,
        email: newContact.email,
        status: 'pending'
      };
      
      const response = await fetch(buildPath('api/addContact'), {
        method: 'POST',
        body: JSON.stringify(contactData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.error) {
        console.error(data.error);
        alert(`Error adding contact: ${data.error}`);
        return;
      }
      
      // Add the new contact to the local state
      const newContactId = selectedEvent.contacts.length > 0 
        ? Math.max(...selectedEvent.contacts.map(c => c.id)) + 1 
        : 1;
      
      const contactToAdd = {
        id: data.contactId || newContactId, // Use the ID from the API if available
        name: newContact.name,
        email: newContact.email,
        attending: 'pending'
      };
      
      const updatedEvent = {
        ...selectedEvent,
        contacts: [...selectedEvent.contacts, contactToAdd]
      };
      
      // Update events array
      setEvents(events.map(event => 
        event.id === selectedEvent.id ? updatedEvent : event
      ));
      
      // Update selected event
      setSelectedEvent(updatedEvent);
      
      // Refresh the event data to get the latest contacts
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        fetchUserEvents(userData.id);
      }
      
      // Reset form
      setNewContact({ name: '', email: '' });
      setShowAddContactForm(false);
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Failed to add contact. Please try again.');
    }
  };

  // Remove contact from event
  const handleRemoveContact = async (contactId: number) => {
    if (!selectedEvent) return;
    
    if (window.confirm(`Are you sure you want to remove this contact?`)) {
      try {
        const response = await fetch(buildPath('api/deleteContact'), {
          method: 'POST',
          body: JSON.stringify({ contactId }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.error) {
          console.error(data.error);
          alert(`Error removing contact: ${data.error}`);
          return;
        }
        
        // Update local state
        const updatedContacts = selectedEvent.contacts.filter(
          contact => contact.id !== contactId
        );
        
        const updatedEvent = {
          ...selectedEvent,
          contacts: updatedContacts
        };
        
        // Update events array
        setEvents(events.map(event => 
          event.id === selectedEvent.id ? updatedEvent : event
        ));
        
        // Update selected event
        setSelectedEvent(updatedEvent);
        
        // Refresh events to get the latest data
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          fetchUserEvents(userData.id);
        }
      } catch (error) {
        console.error('Error removing contact:', error);
        alert('Failed to remove contact. Please try again.');
      }
    }
  };

  // Send invitation to contact
  const handleSendInvite = async (contactId: number) => {
    if (!selectedEvent) return;
    
    try {
      const response = await fetch(buildPath('api/sendInvitation'), {
        method: 'POST',
        body: JSON.stringify({ contactId }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.error) {
        console.error(data.error);
        alert(`Error sending invitation: ${data.error}`);
        return;
      }
      
      // Update local state to show the contact as invited
      const updatedContacts = selectedEvent.contacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, attending: 'invited' } 
          : contact
      );
      
      const updatedEvent = {
        ...selectedEvent,
        contacts: updatedContacts
      };
      
      // Update events array
      setEvents(events.map(event => 
        event.id === selectedEvent.id ? updatedEvent : event
      ));
      
      // Update selected event
      setSelectedEvent(updatedEvent);
      
      alert('Invitation sent successfully!');
      
      // Refresh events to get the latest data
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        fetchUserEvents(userData.id);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user_data');
    navigate('/');
  };

  // Reset event form
  const resetEventForm = () => {
    setEventForm({
      title: '',
      date: '',
      time: '',
      location: '',
      image: '📅',
      description: ''
    });
  };

  // Initialize edit form with event data
  const initEditForm = (event: Event) => {
    setEventForm({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      image: event.image,
      description: event.description || ''
    });
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <div className="navbar">
        <div className="navbar-left">
          <a href="/dashboard" className="brand">
            <span className="brand-icon">☕</span>
            <h1 className="brand-name">espresso events</h1>
          </a>
          
          
        </div>
        
        <div className="navbar-right">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search events..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {userData && (
            <div className="user-info">
              <span className="user-name">Welcome, {userData.firstName}</span>
              <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="events-container">
          <div className="events-header">
            <h2> Events</h2>
            <button 
              className="add-event-button" 
              onClick={() => {
                resetEventForm();
                setShowAddEventModal(true);
              }}
              aria-label="Add event"
            >
              +
            </button>
          </div>
          
          <div className="events-grid">
            {isLoading ? (
              <div className="loading-state">
                <p>Loading events...</p>
              </div>
            ) : errorMessage ? (
              <div className="error-state">
                <p>{errorMessage}</p>
                <button 
                  className="retry-button"
                  onClick={() => {
                    const userDataStr = localStorage.getItem('user_data');
                    if (userDataStr) {
                      const userData = JSON.parse(userDataStr);
                      fetchUserEvents(userData.id);
                    }
                  }}
                >
                  Retry
                </button>
              </div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <div 
                  className="event-card" 
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                >
                  <button 
                    className="delete-event" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.id);
                    }}
                    aria-label="Delete event"
                  >
                    ×
                  </button>
                  <div className="event-icon">
                    <span>{event.image}</span>
                  </div>
                  <h3 className="event-title">{event.title}</h3>
                  <div className="event-details">
                    <p className="event-date">{event.date}</p>
                    <p className="event-time-location">{event.time} · {event.location}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-events">
                <p>No events found. </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Event</h2>
              <button 
                className="close-modal" 
                onClick={() => setShowAddEventModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddEvent}>
              <div className="form-group">
                <label htmlFor="event-title">Event Title</label>
                <input 
                  id="event-title"
                  type="text" 
                  name="title" 
                  value={eventForm.title} 
                  onChange={handleEventInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="event-date">Date</label>
                <input 
                  id="event-date"
                  type="text" 
                  name="date" 
                  value={eventForm.date} 
                  onChange={handleEventInputChange}
                  placeholder="e.g. April 15"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="event-time">Time</label>
                <input 
                  id="event-time"
                  type="text" 
                  name="time" 
                  value={eventForm.time} 
                  onChange={handleEventInputChange}
                  placeholder="e.g. 7PM"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="event-location">Location</label>
                <input 
                  id="event-location"
                  type="text" 
                  name="location" 
                  value={eventForm.location} 
                  onChange={handleEventInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="event-icon">Icon (emoji)</label>
                <div className="emoji-input-container">
                  <input 
                    id="event-icon"
                    type="text" 
                    name="image" 
                    value={eventForm.image} 
                    onChange={handleEventInputChange}
                    placeholder="Select an emoji"
                    readOnly
                  />
                  <button 
                    type="button"
                    className="emoji-picker-button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    😊
                  </button>
                  {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="emoji-picker-container">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="event-description">Description</label>
                <textarea 
                  id="event-description"
                  name="description" 
                  value={eventForm.description} 
                  onChange={handleEventInputChange}
                  placeholder="Event description"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAddEventModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Event Modal */}
      {showEditEventModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Event</h2>
              <button 
                className="close-modal" 
                onClick={() => setShowEditEventModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEditEvent}>
              <div className="form-group">
                <label htmlFor="edit-event-title">Event Title</label>
                <input 
                  id="edit-event-title"
                  type="text" 
                  name="title" 
                  value={eventForm.title} 
                  onChange={handleEventInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-event-date">Date</label>
                <input 
                  id="edit-event-date"
                  type="text" 
                  name="date" 
                  value={eventForm.date} 
                  onChange={handleEventInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-event-time">Time</label>
                <input 
                  id="edit-event-time"
                  type="text" 
                  name="time" 
                  value={eventForm.time} 
                  onChange={handleEventInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-event-location">Location</label>
                <input 
                  id="edit-event-location"
                  type="text" 
                  name="location" 
                  value={eventForm.location} 
                  onChange={handleEventInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-event-icon">Icon (emoji)</label>
                <div className="emoji-input-container">
                  <input 
                    id="edit-event-icon"
                    type="text" 
                    name="image" 
                    value={eventForm.image} 
                    onChange={handleEventInputChange}
                    placeholder="Select an emoji"
                    readOnly
                  />
                  <button 
                    type="button"
                    className="emoji-picker-button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    😊
                  </button>
                  {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="emoji-picker-container">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-event-description">Description</label>
                <textarea 
                  id="edit-event-description"
                  name="description" 
                  value={eventForm.description} 
                  onChange={handleEventInputChange}
                  rows={3}
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowEditEventModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content details-modal">
            <div className="modal-header">
              <h2>Event Details</h2>
              <div className="modal-actions">
                <button 
                  className="edit-button" 
                  onClick={() => {
                    initEditForm(selectedEvent);
                    setShowEditEventModal(true);
                    setShowDetailsModal(false);
                  }}
                  aria-label="Edit event"
                >
                  Edit
                </button>
                <button 
                  className="close-modal" 
                  onClick={() => setShowDetailsModal(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="event-details-content">
              <div className="event-details-header">
                <div className="event-details-icon">{selectedEvent.image}</div>
                <div className="event-details-info">
                  <h3>{selectedEvent.title}</h3>
                  <p className="event-details-date-time">
                    {selectedEvent.date} at {selectedEvent.time}
                  </p>
                  <p className="event-details-location">{selectedEvent.location}</p>
                </div>
              </div>
              
              {selectedEvent.description && (
                <div className="event-description">
                  <h4>Description</h4>
                  <p>{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="contacts-section">
                <div className="contacts-header">
                  <h4>Contacts</h4>
                  <button 
                    className="add-contact-button"
                    onClick={() => setShowAddContactForm(!showAddContactForm)}
                  >
                    {showAddContactForm ? 'Cancel' : 'Add Contact'}
                  </button>
                </div>
                
                {showAddContactForm && (
                  <form onSubmit={handleAddContact} className="add-contact-form">
                    <div className="form-row">
                      <input 
                        type="text" 
                        placeholder="Name" 
                        value={newContact.name}
                        onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                        required
                      />
                      <input 
                        type="email" 
                        placeholder="Email" 
                        value={newContact.email}
                        onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                        required
                      />
                      <button type="submit" className="submit-contact-button">Add</button>
                    </div>
                  </form>
                )}
                
                <div className="contacts-list">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <div className="contact-item" key={contact.id}>
                        <div className="contact-info">
                          <p className="contact-name">{contact.name}</p>
                          <p className="contact-email">{contact.email}</p>
                          <p className="contact-status">
                            Status: <span className={`status-${contact.attending}`}>
                              {contact.attending.charAt(0).toUpperCase() + contact.attending.slice(1)}
                            </span>
                          </p>
                        </div>
                        <div className="contact-actions">
                          <button 
                            className="invite-button"
                            onClick={() => handleSendInvite(contact.id)}
                            disabled={contact.attending === 'yes'}
                          >
                            {contact.attending === 'yes' ? 'Attending' : 'Invite'}
                          </button>
                          <button 
                            className="remove-contact-button"
                            onClick={() => handleRemoveContact(contact.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-contacts">
                      {contactSearchTerm 
                        ? 'No contacts match your search.' 
                        : selectedEvent.contacts.length === 0 
                          ? 'No contacts added yet. Add contacts to invite them to this event.' 
                          : 'No contacts found.'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="details-actions">
                <button 
                  className="close-details-button"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;