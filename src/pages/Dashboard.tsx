import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useGPSData } from '@/hooks/useGPSData';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Map from '@/components/dashboard/Map';
import DevicesSidebar from '@/components/dashboard/DevicesSidebar';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Battery, Shield, MapPin } from 'lucide-react';

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
  const navigate = useNavigate();
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
      owner_id: user?.uid || '',
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
      owner_id: user?.uid || '',
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
      owner_id: user?.uid || '',
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
      owner_id: user?.uid || '',
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
      owner_id: user?.uid || '',
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

  const { gpsData } = useGPSData();

  useEffect(() => {
    // Load devices (using sample data for now)
    setDevices(sampleDevices);
    setSelectedDevice(sampleDevices[0]);
    setLoading(false);

    // Firebase realtime listeners will be handled by useGPSData hook
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
    navigate('/alerts');
  };

  const handleNavigation = (itemId: string) => {
    setActiveView(itemId);
    navigate(`/${itemId === 'dashboard' ? '' : itemId}`);
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
          onItemClick={handleNavigation}
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
          
          <div className="flex-1 flex flex-col">
            {/* Dashboard Stats */}
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-2">Monitor your fleet and devices in real-time</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{devices.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {devices.filter(d => d.status === 'online').length} online
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{getAlertsCount()}</div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
                    <Battery className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      {devices.filter(d => d.battery_percentage < 20).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Below 20%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tracking</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {devices.filter(d => d.latitude && d.longitude).length}
                    </div>
                    <p className="text-xs text-muted-foreground">GPS enabled</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                  <CardDescription>Latest alerts and incidents from your devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {devices
                      .filter(device => device.tamper_status || device.jamming_status || device.battery_percentage < 20)
                      .slice(0, 3)
                      .map(device => (
                        <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-destructive rounded-full" />
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {device.tamper_status && "Tamper detected"}
                                {device.jamming_status && "Signal jamming"}
                                {device.battery_percentage < 20 && `Low battery: ${device.battery_percentage}%`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive">Alert</Badge>
                        </div>
                      ))}
                    {devices.filter(device => device.tamper_status || device.jamming_status || device.battery_percentage < 20).length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No active alerts</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map Section */}
            <div className="flex-1 min-h-[400px] relative">
              <Map
                devices={devices.filter(d => d.latitude && d.longitude)}
                selectedDevice={selectedDevice}
                onDeviceSelect={handleDeviceSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}