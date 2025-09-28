import { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { Device } from '@/hooks/useGPSData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Battery, 
  Gauge, 
  Clock,
  Shield,
  Radio,
  Maximize2
} from 'lucide-react';

interface DeviceTrackingProps {
  device: Device | null;
  open: boolean;
  onClose: () => void;
}

export default function DeviceTracking({ device, open, onClose }: DeviceTrackingProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const marker = useRef<maptilersdk.Marker | null>(null);
  const [mapTilerKey, setMapTilerKey] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const initializeMap = async () => {
    if (!mapContainer.current || !mapTilerKey || !device) return;

    try {
      maptilersdk.config.apiKey = mapTilerKey;

      const center: [number, number] = device.latitude && device.longitude 
        ? [device.longitude, device.latitude]
        : [-74.0060, 40.7128];

      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: maptilersdk.MapStyle.STREETS,
        center: center,
        zoom: 15,
      });

      if (device.latitude && device.longitude) {
        createDeviceMarker();
      }

      setShowTokenInput(false);
    } catch (error) {
      console.error('Error loading MapTiler:', error);
    }
  };

  const createDeviceMarker = () => {
    if (!map.current || !device || !device.latitude || !device.longitude) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundColor = getMarkerColor();
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid #ffffff';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

    marker.current = new maptilersdk.Marker({ element: el })
      .setLngLat([device.longitude, device.latitude] as [number, number])
      .addTo(map.current);

    // Create popup content
    const popupContent = `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; font-weight: bold;">${device.name}</h3>
        <p><strong>Status:</strong> <span style="color: ${getStatusColor()}">${device.status}</span></p>
        <p><strong>Battery:</strong> ${device.batteryPercentage}%</p>
        <p><strong>Speed:</strong> ${device.speed || 0} mph</p>
        <p><strong>Last Update:</strong> ${new Date(device.lastSeen).toLocaleString()}</p>
        ${device.tamperStatus ? '<p style="color: red;"><strong>⚠️ Tamper Alert</strong></p>' : ''}
        ${device.jammingStatus ? '<p style="color: orange;"><strong>📡 Signal Jamming</strong></p>' : ''}
      </div>
    `;

    const popup = new maptilersdk.Popup({ offset: 25 })
      .setHTML(popupContent);

    marker.current.setPopup(popup);
    
    // Auto-open popup for real-time tracking
    popup.addTo(map.current);
  };

  const getMarkerColor = () => {
    if (!device) return '#6b7280';
    if (device.tamperStatus || device.jammingStatus) return '#ef4444';
    switch (device.status) {
      case 'online': return '#10b981';
      case 'offline': return '#6b7280';
      case 'maintenance': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusColor = () => {
    if (!device) return '#6b7280';
    if (device.tamperStatus || device.jammingStatus) return '#ef4444';
    switch (device.status) {
      case 'online': return '#10b981';
      case 'offline': return '#6b7280';
      case 'maintenance': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getBatteryColor = (percentage: number) => {
    if (percentage > 50) return 'text-success';
    if (percentage > 20) return 'text-warning';
    return 'text-destructive';
  };

  // Update marker position when device data changes
  useEffect(() => {
    if (map.current && device && device.latitude && device.longitude) {
      createDeviceMarker();
      map.current.setCenter([device.longitude, device.latitude] as [number, number]);
    }
  }, [device]);

  if (!device) return null;

  if (showTokenInput) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={isFullscreen ? "sm:max-w-[95vw] sm:max-h-[95vh]" : "sm:max-w-4xl"}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Navigation className="w-5 h-5" />
                <span>Track Live - {device.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Card className="p-6 h-96 flex items-center justify-center">
            <div className="max-w-md w-full space-y-4">
              <div className="text-center space-y-2">
                <MapPin className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-lg font-semibold">Setup MapTiler</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your MapTiler API key to enable real-time tracking
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maptiler-key">MapTiler API Key</Label>
                <Input
                  id="maptiler-key"
                  type="password"
                  placeholder="Enter your MapTiler API key..."
                  value={mapTilerKey}
                  onChange={(e) => setMapTilerKey(e.target.value)}
                />
              </div>
              <Button onClick={initializeMap} disabled={!mapTilerKey} className="w-full">
                Initialize Live Tracking
              </Button>
            </div>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={isFullscreen ? "sm:max-w-[95vw] sm:max-h-[95vh]" : "sm:max-w-6xl"}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Navigation className="w-5 h-5" />
              <span>Live Tracking - {device.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Status Bar */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                  {device.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryPercentage)}`} />
                <span className={`font-medium ${getBatteryColor(device.batteryPercentage)}`}>
                  {device.batteryPercentage}%
                </span>
              </div>
              {device.speed !== undefined && (
                <div className="flex items-center space-x-2">
                  <Gauge className="w-4 h-4" />
                  <span className="font-medium">{device.speed} mph</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{new Date(device.lastSeen).toLocaleString()}</span>
              </div>
            </div>
            
            {(device.tamperStatus || device.jammingStatus) && (
              <div className="flex items-center space-x-4">
                {device.tamperStatus && (
                  <div className="flex items-center space-x-1 text-destructive">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Tamper</span>
                  </div>
                )}
                {device.jammingStatus && (
                  <div className="flex items-center space-x-1 text-warning">
                    <Radio className="w-4 h-4" />
                    <span className="text-sm font-medium">Jamming</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div 
            ref={mapContainer} 
            className={`w-full rounded-lg border ${isFullscreen ? 'h-[75vh]' : 'h-96'}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}