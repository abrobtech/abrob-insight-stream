import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, Radio, MapPin, Battery, CheckCircle, Clock } from 'lucide-react';

interface Alert {
  id: string;
  device_id: string;
  device_name: string;
  type: 'tamper' | 'jamming' | 'geofence' | 'battery' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export default function Alerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { devices, loading: gpsLoading } = useFirebaseData();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Generate alerts from real device data
  useEffect(() => {
    if (!gpsLoading && devices.length > 0) {
      const generatedAlerts: Alert[] = [];

      devices.forEach((device) => {
        // Check for battery alerts
        if (device.batteryPercentage < 20) {
          generatedAlerts.push({
            id: `battery_${device.id}`,
            device_id: device.id,
            device_name: device.name,
            type: 'battery',
            severity: device.batteryPercentage < 10 ? 'critical' : 'medium',
            message: `Low battery warning - ${device.batteryPercentage}% remaining`,
            acknowledged: false,
            resolved: false,
            created_at: new Date(Date.now() - Math.random() * 3600000).toISOString()
          });
        }

        // Check for tamper alerts
        if (device.tamperStatus) {
          generatedAlerts.push({
            id: `tamper_${device.id}`,
            device_id: device.id,
            device_name: device.name,
            type: 'tamper',
            severity: 'critical',
            message: 'Tamper detection triggered - device casing opened',
            acknowledged: false,
            resolved: false,
            created_at: new Date(Date.now() - Math.random() * 1800000).toISOString()
          });
        }

        // Check for jamming alerts
        if (device.jammingStatus) {
          generatedAlerts.push({
            id: `jamming_${device.id}`,
            device_id: device.id,
            device_name: device.name,
            type: 'jamming',
            severity: 'high',
            message: 'GPS jamming detected - signal interference active',
            acknowledged: false,
            resolved: false,
            created_at: new Date(Date.now() - Math.random() * 2400000).toISOString()
          });
        }

        // Check for offline devices
        if (device.status === 'offline') {
          generatedAlerts.push({
            id: `offline_${device.id}`,
            device_id: device.id,
            device_name: device.name,
            type: 'anomaly',
            severity: 'medium',
            message: 'Device is offline - no recent GPS data received',
            acknowledged: false,
            resolved: false,
            created_at: new Date(Date.now() - Math.random() * 1200000).toISOString()
          });
        }
      });

      // Add some resolved sample alerts for demonstration
      if (generatedAlerts.length < 2) {
        generatedAlerts.push({
          id: 'resolved_sample',
          device_id: devices[0]?.id || '1',
          device_name: devices[0]?.name || 'Sample Device',
          type: 'geofence',
          severity: 'low',
          message: 'Vehicle exited authorized zone - Downtown Area',
          acknowledged: true,
          acknowledged_by: 'Admin',
          acknowledged_at: new Date(Date.now() - 3600000).toISOString(),
          resolved: true,
          resolved_by: 'Admin',
          resolved_at: new Date(Date.now() - 3000000).toISOString(),
          created_at: new Date(Date.now() - 7200000).toISOString()
        });
      }

      setAlerts(generatedAlerts);
      setLoading(false);
    }
  }, [devices, gpsLoading]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'tamper': return Shield;
      case 'jamming': return Radio;
      case 'geofence': return MapPin;
      case 'battery': return Battery;
      case 'anomaly': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true, acknowledged_by: 'Current User', acknowledged_at: new Date().toISOString() }
        : alert
    ));
  };

  const handleResolve = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, resolved: true, resolved_by: 'Current User', resolved_at: new Date().toISOString() }
        : alert
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (activeTab) {
      case 'unresolved': return !alert.resolved;
      case 'critical': return alert.severity === 'critical';
      case 'resolved': return alert.resolved;
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header alertsCount={alerts.filter(a => !a.resolved).length} onAlertsClick={() => {}} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeItem="alerts"
          onItemClick={(itemId) => navigate(`/${itemId === 'dashboard' ? '' : itemId}`)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Alerts & Incidents</h1>
                <p className="text-muted-foreground">Monitor and manage device security alerts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="font-semibold">Critical</span>
                </div>
                <div className="text-2xl font-bold text-red-600 mt-2">
                  {alerts.filter(a => a.severity === 'critical' && !a.resolved).length}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="font-semibold">High</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 mt-2">
                  {alerts.filter(a => a.severity === 'high' && !a.resolved).length}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="font-semibold">Medium</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mt-2">
                  {alerts.filter(a => a.severity === 'medium' && !a.resolved).length}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-semibold">Resolved</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {alerts.filter(a => a.resolved).length}
                </div>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Alerts</TabsTrigger>
                <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-6">
                {filteredAlerts.map((alert) => {
                  const IconComponent = getAlertIcon(alert.type);
                  return (
                    <Card key={alert.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-lg">{alert.device_name}</h3>
                              <Badge variant={getSeverityVariant(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{alert.type}</Badge>
                            </div>
                            
                            <p className="text-muted-foreground mb-3">{alert.message}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(alert.created_at).toLocaleString()}</span>
                              </div>
                              
                              {alert.acknowledged && (
                                <div className="flex items-center space-x-1 text-blue-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Acknowledged by {alert.acknowledged_by}</span>
                                </div>
                              )}
                              
                              {alert.resolved && (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Resolved by {alert.resolved_by}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {!alert.acknowledged && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          
                          {!alert.resolved && (
                            <Button 
                              size="sm"
                              onClick={() => handleResolve(alert.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}