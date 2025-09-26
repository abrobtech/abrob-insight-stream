import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Battery, Shield, Radio, MapPin } from 'lucide-react';
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
}

export default function Devices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sample data for demo
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
      status: 'online'
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
      status: 'online'
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
      status: 'offline'
    }
  ];

  useEffect(() => {
    setDevices(sampleDevices);
    setLoading(false);
  }, [user]);

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.imei.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getBatteryColor = (percentage: number) => {
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header alertsCount={0} onAlertsClick={() => {}} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeItem="devices"
          onItemClick={(itemId) => navigate(`/${itemId === 'dashboard' ? '' : itemId}`)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">Devices</h1>
              <Button>Add Device</Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDevices.map((device) => (
                <Card key={device.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedDevice(device)}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{device.name}</h3>
                      <p className="text-sm text-muted-foreground">{device.imei}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Battery className="w-4 h-4" />
                        <span className="text-sm">Battery</span>
                      </div>
                      <span className={`font-semibold ${getBatteryColor(device.battery_percentage)}`}>
                        {device.battery_percentage}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">Status</span>
                      </div>
                      <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                        {device.status}
                      </Badge>
                    </div>

                    {device.tamper_status && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Tamper Alert</span>
                      </div>
                    )}

                    {device.jamming_status && (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <Radio className="w-4 h-4" />
                        <span className="text-sm font-medium">Jamming Detected</span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Last seen: {new Date(device.last_seen).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      Track Live
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}