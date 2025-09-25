import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Map from '@/components/dashboard/Map';
import DevicesSidebar from '@/components/dashboard/DevicesSidebar';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: string;
  imei: string;
  name: string;
  owner_id: string;
  last_seen: string;
  battery_percentage: number;
  tamper_status: boolean;
  jamming_status: boolean;
  status: 'online' | 'offline' | 'maintenance';
  latitude?: number;
  longitude?: number;
  speed?: number;
}

interface Location {
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [devicesSidebarCollapsed, setDevicesSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Sample data for demo purposes
  const sampleDevices: Device[] = [
    {
      id: '1',
      imei: 'GT-001-2024',
      name: 'Fleet Vehicle A1',
      owner_id: user?.id || '',
      last_seen: new Date().toISOString(),
      battery_percentage: 85,
      tamper_status: false,
      jamming_status: false,
      status: 'online',
      latitude: 40.7128,
      longitude: -74.0060,
      speed: 25
    },
    {
      id: '2',
      imei: 'GT-002-2024',
      name: 'Personal Vehicle',
      owner_id: user?.id || '',
      last_seen: new Date(Date.now() - 300000).toISOString(),
      battery_percentage: 15,
      tamper_status: true,
      jamming_status: false,
      status: 'online',
      latitude: 40.7589,
      longitude: -73.9851,
      speed: 0
    },
    {
      id: '3',
      imei: 'GT-003-2024',
      name: 'Delivery Truck B2',
      owner_id: user?.id || '',
      last_seen: new Date(Date.now() - 1800000).toISOString(),
      battery_percentage: 67,
      tamper_status: false,
      jamming_status: true,
      status: 'offline',
      latitude: 40.6782,
      longitude: -73.9442,
      speed: 45
    },
    {
      id: '4',
      imei: 'GT-004-2024',
      name: 'Asset Tracker X1',
      owner_id: user?.id || '',
      last_seen: new Date().toISOString(),
      battery_percentage: 92,
      tamper_status: false,
      jamming_status: false,
      status: 'online',
      latitude: 40.7505,
      longitude: -73.9934,
      speed: 12
    },
    {
      id: '5',
      imei: 'GT-005-2024',
      name: 'Equipment Monitor',
      owner_id: user?.id || '',
      last_seen: new Date(Date.now() - 600000).toISOString(),
      battery_percentage: 38,
      tamper_status: false,
      jamming_status: false,
      status: 'maintenance',
      latitude: 40.7282,
      longitude: -73.7949,
      speed: 0
    }
  ];

  useEffect(() => {
    // Load devices (using sample data for now)
    setDevices(sampleDevices);
    setSelectedDevice(sampleDevices[0]);
    setLoading(false);

    // Set up realtime subscriptions
    const devicesChannel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices'
        },
        (payload) => {
          console.log('Device change:', payload);
          // Handle device updates
        }
      )
      .subscribe();

    const locationsChannel = supabase
      .channel('locations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations'
        },
        (payload) => {
          console.log('Location update:', payload);
          // Handle location updates
          handleLocationUpdate(payload.new as Location);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(locationsChannel);
    };
  }, [user]);

  const handleLocationUpdate = (location: Location) => {
    setDevices(prevDevices =>
      prevDevices.map(device =>
        device.id === location.device_id
          ? {
              ...device,
              latitude: location.latitude,
              longitude: location.longitude,
              speed: location.speed,
              last_seen: location.timestamp
            }
          : device
      )
    );
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
  };

  const getAlertsCount = () => {
    return devices.filter(device => 
      device.tamper_status || 
      device.jamming_status || 
      device.battery_percentage < 20
    ).length;
  };

  const handleAlertsClick = () => {
    setActiveView('alerts');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header 
        alertsCount={getAlertsCount()} 
        onAlertsClick={handleAlertsClick}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeItem={activeView}
          onItemClick={setActiveView}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 flex">
          <DevicesSidebar
            devices={devices}
            selectedDevice={selectedDevice}
            onDeviceSelect={handleDeviceSelect}
            collapsed={devicesSidebarCollapsed}
            onToggleCollapse={() => setDevicesSidebarCollapsed(!devicesSidebarCollapsed)}
          />
          
          <div className="flex-1 relative">
            <Map
              devices={devices.filter(d => d.latitude && d.longitude)}
              selectedDevice={selectedDevice}
              onDeviceSelect={handleDeviceSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}