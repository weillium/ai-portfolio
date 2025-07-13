import React, { useEffect, useState, useMemo } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes, fetchAuthSession } from '@aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';

const client = generateClient<Schema>();

const SignedInHome: React.FC = () => <div>Signed In Home Placeholder</div>;

function TabNav({ tabs, selectedTab, onSelectTab, disabledTabs = [] }: { tabs: string[]; selectedTab: string; onSelectTab: (tab: string) => void; disabledTabs?: string[] }) {
  return (
    <nav style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: 20 }}>
      {tabs.map((tab) => {
        const isDisabled = disabledTabs.includes(tab);
        return (
          <button
            key={tab}
            onClick={() => !isDisabled && onSelectTab(tab)}
            disabled={isDisabled}
            style={{
              flex: 1,
              padding: '10px 15px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              border: 'none',
              borderBottom: selectedTab === tab ? '3px solid #0070f3' : '3px solid transparent',
              backgroundColor: 'transparent',
              fontWeight: selectedTab === tab ? 'bold' : 'normal',
              color: isDisabled ? '#999' : 'inherit',
            }}
          >
            {tab}
          </button>
        );
      })}
    </nav>
  );
}

export function SetPreferences() {
  const { user } = useAuthenticator();
  const userId = user?.username ?? '';

  const [preferredUsername, setPreferredUsername] = useState('');
  const [airports, setAirports] = useState<Array<{airport_id: string; airport_name: string; airport_code: string}>>([]);
  const [homeAirportId, setHomeAirportId] = useState<string>('');
  const [memberId, setMemberId] = useState<string>('');
  const [preferredFlightClass, setPreferredFlightClass] = useState<'economy' | 'business' | 'first'>('economy');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userPrefId, setUserPrefId] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPreferredUsername() {
      try {
        const attributes = await fetchUserAttributes();
        setPreferredUsername(attributes.preferred_username ?? '');
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    }

    async function fetchAirports() {
      try {
        const response = await client.models.JetblueAirports.list();
        setAirports(response.data ?? []);
      } catch (error) {
        console.error('Error fetching airports:', error);
      }
    }

    async function fetchUserPref() {
      if (!userId) return;
      try {
        const existingPrefs = await client.models.JetblueUserPreferences.list({
          filter: { user_id: { eq: userId } },
        });
        if (existingPrefs.data && existingPrefs.data.length > 0) {
          const pref = existingPrefs.data[0];
          setUserPrefId(pref.user_preference_id);
          setHomeAirportId(pref.home_airport_id);
          setMemberId(pref.member_id ?? '');
          setPreferredFlightClass(pref.preferred_flight_class ?? 'economy');
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
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

    fetchPreferredUsername();
    fetchAirports();
    fetchUserPref();
    fetchGroups();
  }, [userId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (userPrefId) {
        await client.models.JetblueUserPreferences.update({
          user_preference_id: userPrefId,
          user_id: userId,
          home_airport_id: homeAirportId,
          member_id: memberId || null,
          preferred_flight_class: preferredFlightClass,
        });
        setMessage('Preferences updated successfully.');
      } else {
        const newId = uuidv4();
        await client.models.JetblueUserPreferences.create({
          user_preference_id: newId,
          user_id: userId,
          home_airport_id: homeAirportId,
          member_id: memberId || null,
          preferred_flight_class: preferredFlightClass,
          airports_visited: 0,
          total_spend_usd: 0,
        });
        setUserPrefId(newId);
        setMessage('Preferences set successfully.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Set Your Jetblue Preferences</h2>

      {!userPrefId && (
        <p style={{ color: 'red', marginBottom: 20 }}>
          To access the remainder of this app, you must first set your preferences.
        </p>
      )}

      <div style={{ marginBottom: 20, padding: 10, border: '1px solid #ccc', borderRadius: 4, backgroundColor: '#f9f9f9' }}>
        <p><strong>Preferred Username:</strong> {preferredUsername}</p>
        <p><strong>Groups:</strong> {groups.length > 0 ? groups.join(', ') : 'None'}</p>
        <p><strong>User ID:</strong> {userId}</p>
        <p><strong>User Preference ID:</strong> {userPrefId ?? 'Not set'}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label htmlFor="homeAirport" style={{ display: 'block', marginBottom: 5 }}>Home Airport:</label>
          <select
            id="homeAirport"
            value={homeAirportId}
            onChange={(e) => setHomeAirportId(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          >
            <option value="" disabled>Select an airport</option>
            {airports.map((airport) => (
              <option key={airport.airport_id} value={airport.airport_id}>
                {airport.airport_name} ({airport.airport_code})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label htmlFor="memberId" style={{ display: 'block', marginBottom: 5 }}>Jetblue Member ID:</label>
          <input
            type="text"
            id="memberId"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="Enter your member ID"
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label htmlFor="preferredFlightClass" style={{ display: 'block', marginBottom: 5 }}>Preferred Flight Class:</label>
          <select
            id="preferredFlightClass"
            value={preferredFlightClass}
            onChange={(e) => setPreferredFlightClass(e.target.value as 'economy' | 'business' | 'first')}
            required
            style={{ width: '100%', padding: 8 }}
          >
            <option value="economy">Economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </div>

        <button type="submit" disabled={loading} style={{ padding: '10px 15px' }}>
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>

      {message && <p style={{ marginTop: 15 }}>{message}</p>}
    </div>
  );
}

const JetblueAirports: React.FC = () => {
  const { user } = useAuthenticator();
  const [userPref, setUserPref] = useState<Schema['JetblueUserPreferences']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('Preferences');
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    async function fetchUserPref() {
      if (!user) {
        setUserPref(null);
        setLoading(false);
        return;
      }
      try {
        const userId = user.username;
        const response = await client.models.JetblueUserPreferences.list({
          filter: { user_id: { eq: userId } }
        });
        setUserPref(response.data?.[0] ?? null);
      } catch {
        setUserPref(null);
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

    fetchUserPref();
    fetchGroups();
  }, [user]);

  const isAdmin = groups.includes('admin');

  const enabledTabs = useMemo(() => {
    if (isAdmin) return ['Home', 'Airports', 'Trips', 'Users', 'Preferences'];
    return userPref ? ['Home', 'Airports', 'Trips', 'Users', 'Preferences'] : ['Preferences'];
  }, [userPref, isAdmin]);

  const disabledTabs = useMemo(() => {
    if (isAdmin) return [];
    if (userPref) return [];
    return ['Home', 'Airports', 'Trips', 'Users'];
  }, [userPref, isAdmin]);

  useEffect(() => {
    if (!enabledTabs.includes(selectedTab)) {
      setSelectedTab('Preferences');
    }
  }, [selectedTab, enabledTabs]);

  if (loading) return <div>Loading...</div>;

  const tabs = ['Home', 'Airports', 'Trips', 'Users', 'Preferences'];

  function renderTabContent() {
    switch (selectedTab) {
      case 'Home':
        return <SignedInHome />;
      case 'Airports':
        return <div>Airports Content Placeholder</div>;
      case 'Trips':
        return <div>Trips Content Placeholder</div>;
      case 'Users':
        return <div>Users Content Placeholder</div>;
      case 'Preferences':
        return <SetPreferences />;
      default:
        return null;
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <TabNav
        tabs={tabs}
        selectedTab={selectedTab}
        onSelectTab={(tab) => {
          if (!disabledTabs.includes(tab)) {
            setSelectedTab(tab);
          }
        }}
        disabledTabs={disabledTabs}
      />
      {renderTabContent()}
    </div>
  );
};

export default JetblueAirports;
