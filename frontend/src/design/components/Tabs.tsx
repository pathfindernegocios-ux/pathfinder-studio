// src/design/components/Tabs.tsx
import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { radius, space } from '../tokens';

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  items: { value: string; label: string; icon?: React.ReactNode }[];
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  items,
  children,
}) => {
  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
    >
      <TabsPrimitive.List
        style={{
          display: 'flex',
          gap: space[2],
          paddingBottom: space[4],
          borderBottom: '1px solid var(--pf-border-subtle)',
          marginBottom: space[6],
          overflowX: 'auto',
        }}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: radius.full,
              fontFamily: 'var(--pf-font-ui)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--pf-text-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              whiteSpace: 'nowrap',
            }}
            className="pf-tab-trigger"
          >
            {item.icon}
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
};

export const TabContent: React.FC<{ value: string; children: React.ReactNode }> = ({
  value,
  children,
}) => (
  <TabsPrimitive.Content value={value} style={{ outline: 'none' }}>
    {children}
  </TabsPrimitive.Content>
);
