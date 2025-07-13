import React, { useEffect, useState, useMemo } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from '@aws-amplify/auth';
import TabNav from './TabNav';
import SignedInHome from './SignedInHome';
import Airports from './Airports';
import SetPreferences from './SetPreferences';

export default function JetblueAirports() {
  const { user } = useAuthenticator();
  const [userPref, setUserPref] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('Preferences');
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    async function fetchUserPref() {
      if (!user) {
        setUserPref(null);
        setLoading(false);
        return;
      }
      try {
        const userId = user.username;
        const response = await import('aws-amplify/data').then(({ generateClient }) => {
          const client = generateClient();
          return client.models.JetblueUserPreferences.list({
            filter: { user_id: { eq: userId } }
          });
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
        return <Airports />;
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
}
