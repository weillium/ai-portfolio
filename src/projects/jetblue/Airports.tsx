import React, { useEffect, useState } from 'react';
import { fetchAuthSession } from '@aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { v4 as uuidv4 } from 'uuid';

const client = generateClient();

function AddAirportModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: () => void }) {
  const [airportName, setAirportName] = React.useState('');
  const [airportCode, setAirportCode] = React.useState('');
  const [airportCity, setAirportCity] = React.useState('');
  const [airportState, setAirportState] = React.useState('');
  const [airportCountry, setAirportCountry] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await client.models.JetblueAirports.create({
        airport_id: uuidv4(),
        airport_name: airportName,
        airport_code: airportCode,
        airport_city: airportCity,
        airport_state: airportState,
        airport_country: airportCountry,
        airport_latitude: 0, // placeholder
        airport_longitude: 0, // placeholder
      });
      onAdd();
      onClose();
    } catch (err) {
      setError('Failed to add airport');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1500,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', padding: 20, borderRadius: 8, minWidth: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Add Airport</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Name:
            <input
              type="text"
              value={airportName}
              onChange={(e) => setAirportName(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </label>
          <label>
            Code:
            <input
              type="text"
              value={airportCode}
              onChange={(e) => setAirportCode(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </label>
          <label>
            City:
            <input
              type="text"
              value={airportCity}
              onChange={(e) => setAirportCity(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </label>
          <label>
            State:
            <input
              type="text"
              value={airportState}
              onChange={(e) => setAirportState(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </label>
          <label>
            Country:
            <input
              type="text"
              value={airportCountry}
              onChange={(e) => setAirportCountry(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </label>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ marginRight: 10 }}>
            {loading ? 'Adding...' : 'Add Airport'}
          </button>
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

const Airports: React.FC = () => {
  const [airports, setAirports] = useState<Array<{airport_id: string; airport_name: string; airport_code: string; airport_city: string; airport_state: string; airport_country: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    async function fetchAirports() {
      try {
        const response = await client.models.JetblueAirports.list();
        setAirports(response.data ?? []);
      } catch (error) {
        console.error('Error fetching airports:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchGroups() {
      try {
        const session = await fetchAuthSession();
        if (
          session.tokens &&
          session.tokens.accessToken &&
          session.tokens.accessToken.payload &&
          session.tokens.accessToken.payload['cognito:groups']
        ) {
          const groupsFromToken = session.tokens.accessToken.payload['cognito:groups'];
          if (typeof groupsFromToken === 'string') {
            setGroups(groupsFromToken.split(','));
          } else if (Array.isArray(groupsFromToken)) {
            setGroups(groupsFromToken.map((g) => String(g)));
          } else {
            setGroups([]);
          }
        } else {
          setGroups([]);
        }
      } catch (error) {
        console.error('Error fetching auth session groups:', error);
        setGroups([]);
      }
    }

    fetchAirports();
    fetchGroups();
  }, []);

  const isAdmin = groups.includes('admin');

  if (loading) return <div>Loading airports...</div>;

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <button style={{ marginRight: 10 }} onClick={() => setIsAddModalOpen(true)}>Add Airport</button>
        {isAdmin && (
          <>
            <button style={{ marginRight: 10 }}>Edit Airport</button>
            <button>Delete Airport</button>
          </>
        )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Name</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Code</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>City</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>State</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Country</th>
          </tr>
        </thead>
        <tbody>
          {airports.map((airport) => (
            <tr key={airport.airport_id}>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_name}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_code}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_city}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_state}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_country}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <AddAirportModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={() => {
          setIsAddModalOpen(false);
          setLoading(true);
          client.models.JetblueAirports.list().then((response) => {
            setAirports(response.data ?? []);
            setLoading(false);
          });
        }}
      />
    </div>
  );
};

export default Airports;
