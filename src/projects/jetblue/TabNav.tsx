import React from 'react';

interface TabNavProps {
  tabs: string[];
  selectedTab: string;
  onSelectTab: (tab: string) => void;
  disabledTabs?: string[];
}

const TabNav: React.FC<TabNavProps> = ({ tabs, selectedTab, onSelectTab, disabledTabs = [] }) => {
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
};

export default TabNav;
