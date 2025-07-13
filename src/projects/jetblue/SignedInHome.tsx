import React, { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { fetchUserAttributes } from '@aws-amplify/auth';
import Chatbot from 'react-chatbotify';

const client = generateClient<Schema>();

const milestones = [15, 20, 25];

const SignedInHome: React.FC = () => {
  const { user } = useAuthenticator();
  const userId = user?.username ?? '';

  const [preferredUsername, setPreferredUsername] = useState('');
  const [airportCount, setAirportCount] = useState<number>(0);

  useEffect(() => {
    async function fetchPreferredUsername() {
      try {
        const attributes = await fetchUserAttributes();
        setPreferredUsername(attributes.preferred_username ?? '');
      } catch (error) {
        console.error('Error fetching user attributes:', error);
        setPreferredUsername('');
      }
    }

    async function fetchAirportCount() {
      if (!userId) {
        setAirportCount(0);
        return;
      }
      try {
        const response = await client.models.JetblueUserAirports.list({
          filter: { user_id: { eq: userId } },
        });
        const uniqueAirports = new Set(response.data?.map(a => a.airport_id));
        setAirportCount(uniqueAirports.size);
      } catch (error) {
        console.error('Error fetching user airports:', error);
        setAirportCount(0);
      }
    }

    fetchPreferredUsername();
    fetchAirportCount();
  }, [userId]);

  const maxMilestone = milestones[milestones.length - 1];
  const progressPercent = Math.min((airportCount / maxMilestone) * 100, 100);

  // Calculate position for each milestone node in percentage
  const milestonePositions = milestones.map(m => (m / maxMilestone) * 100);

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Hi {preferredUsername || userId},</h1>
      <p>You have visited {airportCount} Jetblue airports.</p>

      <div style={{ marginTop: 20 }}>
        <div style={{ position: 'relative', height: 40, marginBottom: 10 }}>
          {/* Progress bar background */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: '#ddd',
            borderRadius: 4,
            transform: 'translateY(-50%)'
          }} />

          {/* Progress bar fill */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            height: 8,
            width: `${progressPercent}%`,
            backgroundColor: '#0070f3',
            borderRadius: 4,
            transform: 'translateY(-50%)',
            transition: 'width 0.3s ease-in-out'
          }} />

          {/* Milestone nodes */}
          {milestones.map((milestone, index) => {
            const leftPercent = milestonePositions[index];
            const reached = airportCount >= milestone;
            return (
              <div key={milestone} style={{
                position: 'absolute',
                top: '50%',
                left: `${leftPercent}%`,
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                cursor: 'default',
                userSelect: 'none'
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: reached ? '#0070f3' : '#bbb',
                  border: '2px solid',
                  borderColor: reached ? '#005bb5' : '#999',
                  marginBottom: 4,
                  transition: 'background-color 0.3s ease, border-color 0.3s ease'
                }} />
                <div style={{ fontSize: 12, color: reached ? '#0070f3' : '#666' }}>{milestone}</div>
              </div>
            );
          })}
        </div>
        {/* Removed the percentage complete text as requested */}
      </div>
      <hr style={{ marginTop: 20, borderColor: '#ccc' }} />
      <h3 style={{ marginTop: 10 }}>Where to next?</h3>

      {/* Embedded chatbot under 'Where to next?' */}
        <Chatbot 
            settings={{ 
              general: { 
                embedded: true, 
                primaryColor: '#0070f3', 
                showHeader: false, 
                showFooter: false, 
            }
            }}
            styles={{
              chatWindowStyle: { width: '100%' }
            }}
        />
    </div>
  );
};

export default SignedInHome;
