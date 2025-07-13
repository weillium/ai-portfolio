import React, { useEffect, useState } from 'react';
import { fetchAuthSession } from '@aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { v4 as uuidv4 } from 'uuid';
// Import the generated types from your Amplify Data schema
import type { Schema } from '../../../amplify/data/resource'; // Adjust path as needed

const client = generateClient<Schema>();

interface BulkAirportData {
  airport_name: string;
  airport_code: string;
  airport_city: string;
  airport_state: string;
  airport_country: string;
  airport_latitude: number;
  airport_longitude: number;
}

function AddAirportModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: () => void }) {
  const [airportName, setAirportName] = React.useState('');
  const [airportCode, setAirportCode] = React.useState('');
  const [airportCity, setAirportCity] = React.useState('');
  const [airportState, setAirportState] = React.useState('');
  const [airportCountry, setAirportCountry] = React.useState('');
  const [airportLatitude, setAirportLatitude] = React.useState(0);
  const [airportLongitude, setAirportLongitude] = React.useState(0);
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
        airport_latitude: airportLatitude,
        airport_longitude: airportLongitude
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
          <label>
            Latitude:
            <input
              type="number"
              value={airportLatitude}
              onChange={(e) => setAirportLatitude(parseFloat(e.target.value))}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </label>
          <label>
            Longitude:
            <input
              type="number"
              value={airportLongitude}
              onChange={(e) => setAirportLongitude(parseFloat(e.target.value))}
              required
              style={{ width: '100%', marginBottom: 10 }}
            /> 
          </label>
          <br />
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

function BulkAddAirportsModal({ isOpen, onClose, onBulkAdd }: { isOpen: boolean; onClose: () => void; onBulkAdd: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [textAreaValue, setTextAreaValue] = React.useState('');

  // Parse CSV or JSON input from textarea
  function parseInput(input: string): BulkAirportData[] | null {
    try {
      // Try JSON parse first
      const jsonData = JSON.parse(input);
      if (Array.isArray(jsonData)) {
        return jsonData;
      }
      return null;
    } catch {
      // Fallback to CSV parse
      const lines = input.trim().split('\n');
      if (lines.length < 2) return null;
      const headers = lines[0].split(',').map(h => h.trim());
      const data: BulkAirportData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) return null;
        const entry: Partial<BulkAirportData> = {};
        for (let j = 0; j < headers.length; j++) {
          const key = headers[j] as keyof BulkAirportData;
          if (key === 'airport_latitude' || key === 'airport_longitude') {
            entry[key] = parseFloat(values[j]) as number;
          } else {
            entry[key] = values[j] as string;
          }
        }
        data.push(entry as BulkAirportData);
      }
      return data;
    }
  }

  async function handleBulkAdd() {
    setLoading(true);
    setError('');
    const data = parseInput(textAreaValue);
    if (!data) {
      setError('Invalid input format. Please provide valid JSON array or CSV data.');
      setLoading(false);
      return;
    }

    try {
      for (const airport of data) {
        await client.models.JetblueAirports.create({
          airport_id: uuidv4(),
          airport_name: airport.airport_name,
          airport_code: airport.airport_code,
          airport_city: airport.airport_city,
          airport_state: airport.airport_state,
          airport_country: airport.airport_country,
          airport_latitude: airport.airport_latitude,
          airport_longitude: airport.airport_longitude,
        });
      }
      onBulkAdd();
      onClose();
    } catch (err) {
      setError('Failed to add airports in bulk');
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
        style={{ background: 'white', padding: 20, borderRadius: 8, minWidth: 320, maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Bulk Add Airports</h2>
        <p>Paste JSON array or CSV data below. CSV header must match keys: airport_name, airport_code, airport_city, airport_state, airport_country, airport_latitude, airport_longitude</p>
        <textarea
          value={textAreaValue}
          onChange={(e) => setTextAreaValue(e.target.value)}
          rows={15}
          style={{ width: '100%', marginBottom: 10 }}
          placeholder='[ { "airport_name": "Name", "airport_code": "Code", ... }, ... ] or CSV format'
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={handleBulkAdd} disabled={loading} style={{ marginRight: 10 }}>
          {loading ? 'Adding...' : 'Add Airports'}
        </button>
        <button onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </div>
  );
}

function EditAirportModal({ isOpen, onClose, airports, onEdit }: { isOpen: boolean; onClose: () => void; airports: Array<{airport_id: string; airport_name: string; airport_code: string; airport_city: string; airport_state: string; airport_country: string; airport_latitude: number; airport_longitude: number}>; onEdit: () => void }) {
  const [selectedCode, setSelectedCode] = React.useState('');
  const [airportName, setAirportName] = React.useState('');
  const [airportCity, setAirportCity] = React.useState('');
  const [airportState, setAirportState] = React.useState('');
  const [airportCountry, setAirportCountry] = React.useState('');
  const [airportLatitude, setAirportLatitude] = React.useState(0);
  const [airportLongitude, setAirportLongitude] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (selectedCode) {
      const airport = airports.find(a => a.airport_code === selectedCode);
      if (airport) {
        setAirportName(airport.airport_name);
        setAirportCity(airport.airport_city);
        setAirportState(airport.airport_state);
        setAirportCountry(airport.airport_country);
        setAirportLatitude(airport.airport_latitude);
        setAirportLongitude(airport.airport_longitude);
      }
    } else {
      setAirportName('');
      setAirportCity('');
      setAirportState('');
      setAirportCountry('');
      setAirportLatitude(0);
      setAirportLongitude(0);
    }
  }, [selectedCode, airports]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCode) {
      setError('Please select an airport code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const airport = airports.find(a => a.airport_code === selectedCode);
      if (!airport) {
        setError('Selected airport not found');
        setLoading(false);
        return;
      }
      await client.models.JetblueAirports.update({
        airport_id: airport.airport_id,
        airport_name: airportName,
        airport_code: selectedCode,
        airport_city: airportCity,
        airport_state: airportState,
        airport_country: airportCountry,
        airport_latitude: airportLatitude,
        airport_longitude: airportLongitude,
      });
      onEdit();
      onClose();
    } catch (err) {
      setError('Failed to update airport');
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
        <h2>Edit Airport</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Select Airport Code:
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 10 }}
            >
              <option value="">-- Select --</option>
              {airports.map((airport) => (
                <option key={airport.airport_id} value={airport.airport_code}>
                  {airport.airport_code} - {airport.airport_name}
                </option>
              ))}
            </select>
          </label>
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
          <label>
            Latitude:
            <input
              type="number"
              value={airportLatitude}
              onChange={(e) => setAirportLatitude(parseFloat(e.target.value))}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </label>
          <label>
            Longitude:
            <input
              type="number"
              value={airportLongitude}
              onChange={(e) => setAirportLongitude(parseFloat(e.target.value))}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </label>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ marginRight: 10 }}>
            {loading ? 'Updating...' : 'Update Airport'}
          </button>
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

function DeleteAirportModal({ isOpen, onClose, airports, onDelete }: { isOpen: boolean; onClose: () => void; airports: Array<{airport_id: string; airport_name: string; airport_code: string}>; onDelete: () => void }) {
  const [selectedCode, setSelectedCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleDelete() {
    if (!selectedCode) {
      setError('Please select an airport code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const airport = airports.find(a => a.airport_code === selectedCode);
      if (!airport) {
        setError('Selected airport not found');
        setLoading(false);
        return;
      }
      await client.models.JetblueAirports.delete({ airport_id: airport.airport_id });
      onDelete();
      onClose();
    } catch (err) {
      setError('Failed to delete airport');
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
        <h2>Delete Airport</h2>
        <label>
          Select Airport Code:
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10 }}
          >
            <option value="">-- Select --</option>
            {airports.map((airport) => (
              <option key={airport.airport_id} value={airport.airport_code}>
                {airport.airport_code} - {airport.airport_name}
              </option>
            ))}
          </select>
        </label>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={handleDelete} disabled={loading} style={{ marginRight: 10 }}>
          {loading ? 'Deleting...' : 'Delete Airport'}
        </button>
        <button onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </div>
  );
}

const Airports: React.FC = () => {
  const [airports, setAirports] = useState<Array<{airport_id: string; airport_name: string; airport_code: string; airport_city: string; airport_state: string; airport_country: string; airport_latitude: number; airport_longitude: number;}>>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<string[]>([]);
  const [userVisitedAirportIds, setUserVisitedAirportIds] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  // New states for sorting and filtering
  const [filterText, setFilterText] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [visitedFilter, setVisitedFilter] = useState<'all' | 'visited' | 'not_visited'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof typeof airports[0] | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });

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

    async function fetchUserVisitedAirports(currentUserId: string) {
      try {
        const response = await client.models.JetblueUserAirports.list({
          filter: {
            user_id: { eq: currentUserId },
            visited: { eq: true },
          },
        });
        const visitedIds = new Set(response.data?.map((ua) => ua.airport_id) ?? []);
        setUserVisitedAirportIds(visitedIds);
      } catch (error) {
        console.error('Error fetching user visited airports:', error);
      }
    }

    async function fetchGroupsAndUser() {
      try {
        const session = await fetchAuthSession();
        if (
          session.tokens &&
          session.tokens.accessToken &&
          session.tokens.accessToken.payload
        ) {
          const groupsFromToken = session.tokens.accessToken.payload['cognito:groups'];
          if (typeof groupsFromToken === 'string') {
            setGroups(groupsFromToken.split(','));
          } else if (Array.isArray(groupsFromToken)) {
            setGroups(groupsFromToken.map((g) => String(g)));
          } else {
            setGroups([]);
          }
          const userIdFromToken = session.tokens.accessToken.payload.sub ?? null;
          if (userIdFromToken) {
            fetchUserVisitedAirports(userIdFromToken);
          }
        } else {
          setGroups([]);
        }
      } catch (error) {
        console.error('Error fetching auth session groups or user:', error);
        setGroups([]);
      }
    }

    fetchAirports();
    fetchGroupsAndUser();
  }, []);

  const isAdmin = groups.includes('admin');

  // Get unique countries for dropdown
  const uniqueCountries = Array.from(new Set(airports.map(a => a.airport_country))).sort();

  // Filter airports by filterText, countryFilter, and visitedFilter
  const filteredAirports = airports.filter((airport) => {
    const searchText = filterText.toLowerCase();
    const matchesText = (
      airport.airport_name.toLowerCase().includes(searchText) ||
      airport.airport_code.toLowerCase().includes(searchText) ||
      airport.airport_city.toLowerCase().includes(searchText) ||
      airport.airport_state.toLowerCase().includes(searchText) ||
      airport.airport_country.toLowerCase().includes(searchText)
    );
    const matchesCountry = countryFilter ? airport.airport_country === countryFilter : true;
    const isVisited = userVisitedAirportIds.has(airport.airport_id);
    const matchesVisited =
      visitedFilter === 'all' ? true : visitedFilter === 'visited' ? isVisited : !isVisited;

    return matchesText && matchesCountry && matchesVisited;
  });

  // Sort airports based on sortConfig
  const sortedAirports = React.useMemo(() => {
    if (!sortConfig.key) return filteredAirports;
    const sorted = [...filteredAirports].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    return sorted;
  }, [filteredAirports, sortConfig]);

  function requestSort(key: keyof typeof airports[0]) {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }

  if (loading) return <div>Loading airports...</div>;

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <button style={{ marginRight: 10 }} onClick={() => setIsAddModalOpen(true)}>Add Airport</button>
        <button style={{ marginRight: 10 }} onClick={() => setIsBulkAddModalOpen(true)}>Bulk Add Airports</button>
        {isAdmin && (
          <>
            <button style={{ marginRight: 10 }} onClick={() => setIsEditModalOpen(true)}>Edit Airport</button>
            <button style={{ marginRight: 10 }} onClick={() => setIsDeleteModalOpen(true)}>Delete Airport</button>
          </>
        )}
      </div>

      {/* Filter inputs */}
      <input
        type="text"
        placeholder="Filter airports..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        style={{ marginBottom: 10, width: 'calc(100% - 240px)', padding: '8px', marginRight: 10 }}
      />
      <select
        value={countryFilter}
        onChange={(e) => setCountryFilter(e.target.value)}
        style={{ marginBottom: 10, width: 110, padding: '8px', marginRight: 10 }}
      >
        <option value="">All Countries</option>
        {uniqueCountries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
      <select
        value={visitedFilter}
        onChange={(e) => setVisitedFilter(e.target.value as 'all' | 'visited' | 'not_visited')}
        style={{ marginBottom: 10, width: 110, padding: '8px' }}
      >
        <option value="all">All</option>
        <option value="visited">Visited</option>
        <option value="not_visited">Not Visited</option>
      </select>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px', cursor: 'pointer' }}
              onClick={() => requestSort('airport_name')}
            >
              Name {sortConfig.key === 'airport_name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
            </th>
            <th
              style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px', cursor: 'pointer' }}
              onClick={() => requestSort('airport_code')}
            >
              Code {sortConfig.key === 'airport_code' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
            </th>
            <th
              style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px', cursor: 'pointer' }}
              onClick={() => requestSort('airport_city')}
            >
              City {sortConfig.key === 'airport_city' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
            </th>
            <th
              style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px', cursor: 'pointer' }}
              onClick={() => requestSort('airport_state')}
            >
              State {sortConfig.key === 'airport_state' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
            </th>
            <th
              style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px', cursor: 'pointer' }}
              onClick={() => requestSort('airport_country')}
            >
              Country {sortConfig.key === 'airport_country' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
            </th>
            <th
              style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px', cursor: 'pointer' }}
              onClick={() => requestSort('airport_latitude')}
            >
              Latitude {sortConfig.key === 'airport_latitude' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
            </th>
            <th
              style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px', cursor: 'pointer' }}
              onClick={() => requestSort('airport_longitude')}
            >
              Longitude {sortConfig.key === 'airport_longitude' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
            </th>
            <th
              style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}
            >
              Visited
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedAirports.map((airport) => (
            <tr key={airport.airport_id}>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_name}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_code}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_city}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_state}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_country}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_latitude}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{airport.airport_longitude}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{userVisitedAirportIds.has(airport.airport_id) ? 'TRUE' : 'FALSE'}</td>
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

      <BulkAddAirportsModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onBulkAdd={() => {
          setIsBulkAddModalOpen(false);
          setLoading(true);
          client.models.JetblueAirports.list().then((response) => {
            setAirports(response.data ?? []);
            setLoading(false);
          });
        }}
      />

      <EditAirportModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        airports={airports}
        onEdit={() => {
          setIsEditModalOpen(false);
          setLoading(true);
          client.models.JetblueAirports.list().then((response) => {
            setAirports(response.data ?? []);
            setLoading(false);
          });
        }}
      />

      <DeleteAirportModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        airports={airports}
        onDelete={() => {
          setIsDeleteModalOpen(false);
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
