import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Settings, CreditCard, Activity, Plus, Edit, Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company: string;
  created_at: string;
  last_active: string;
  device_count: number;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  // Sample users data
  const sampleUsers: User[] = [
    {
      id: '1',
      email: 'john.doe@company.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'admin',
      company: 'Tech Corp',
      created_at: new Date(Date.now() - 2592000000).toISOString(),
      last_active: new Date(Date.now() - 3600000).toISOString(),
      device_count: 5
    },
    {
      id: '2',
      email: 'jane.smith@company.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'user',
      company: 'Logistics Inc',
      created_at: new Date(Date.now() - 1296000000).toISOString(),
      last_active: new Date(Date.now() - 1800000).toISOString(),
      device_count: 3
    },
    {
      id: '3',
      email: 'mike.johnson@company.com',
      first_name: 'Mike',
      last_name: 'Johnson',
      role: 'manager',
      company: 'Fleet Solutions',
      created_at: new Date(Date.now() - 604800000).toISOString(),
      last_active: new Date().toISOString(),
      device_count: 8
    }
  ];

  // Sample system logs
  const sampleLogs: SystemLog[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'User jane.smith@company.com logged in successfully',
      source: 'auth'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'warning',
      message: 'Device GT-003-2024 battery level below 20%',
      source: 'device'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'error',
      message: 'Failed to process location update for device GT-002-2024',
      source: 'location'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      level: 'info',
      message: 'New device GT-005-2024 registered successfully',
      source: 'device'
    }
  ];

  useEffect(() => {
    setUsers(sampleUsers);
    setSystemLogs(sampleLogs);
    setLoading(false);
  }, [user]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
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
          activeItem="admin"
          onItemClick={() => {}}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Administration</h1>
                <p className="text-muted-foreground">Manage users, devices, and system settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Total Users</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-2">{users.length}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Active Devices</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {users.reduce((sum, user) => sum + user.device_count, 0)}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold">Monthly Revenue</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-2">$12,450</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold">System Health</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">99.9%</div>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="devices">Device Provisioning</TabsTrigger>
                <TabsTrigger value="logs">System Logs</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">User Management</h2>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Devices</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.first_name} {user.last_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                          </TableCell>
                          <TableCell>{user.company}</TableCell>
                          <TableCell>{user.device_count}</TableCell>
                          <TableCell>{new Date(user.last_active).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="devices" className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Device Provisioning</h2>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Provision Device
                  </Button>
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Add New Device</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="imei">IMEI Number</Label>
                      <Input id="imei" placeholder="Enter device IMEI" />
                    </div>
                    <div>
                      <Label htmlFor="device_name">Device Name</Label>
                      <Input id="device_name" placeholder="Enter device name" />
                    </div>
                    <div>
                      <Label htmlFor="owner_email">Owner Email</Label>
                      <Input id="owner_email" placeholder="Enter owner email" />
                    </div>
                    <div>
                      <Label htmlFor="device_type">Device Type</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="vehicle">Vehicle Tracker</option>
                        <option value="personal">Personal Tracker</option>
                        <option value="asset">Asset Tracker</option>
                      </select>
                    </div>
                  </div>
                  <Button className="mt-4">Provision Device</Button>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4 mt-6">
                <h2 className="text-xl font-semibold">System Logs</h2>
                
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${getLogLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.source}</Badge>
                          </TableCell>
                          <TableCell>{log.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-4 mt-6">
                <h2 className="text-xl font-semibold">Billing Management</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-2">Current Plan</h3>
                    <div className="text-2xl font-bold text-primary mb-2">Enterprise</div>
                    <p className="text-muted-foreground">$99/month per 10 devices</p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-2">Next Billing Date</h3>
                    <div className="text-2xl font-bold mb-2">Oct 23, 2024</div>
                    <p className="text-muted-foreground">Auto-renew enabled</p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-2">Usage This Month</h3>
                    <div className="text-2xl font-bold mb-2">16 devices</div>
                    <p className="text-muted-foreground">6 over base plan</p>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Billing History</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>September 2024</span>
                      <span className="font-medium">$158.00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>August 2024</span>
                      <span className="font-medium">$142.00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>July 2024</span>
                      <span className="font-medium">$99.00</span>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}