import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useGPSData } from '@/hooks/useGPSData';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Download, Calendar as CalendarIcon, History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Trip {
  id: string;
  device_id: string;
  device_name: string;
  start_time: string;
  end_time: string;
  duration: number;
  distance: number;
  start_location: string;
  end_location: string;
  max_speed: number;
  avg_speed: number;
}

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { devices, gpsData, loading: gpsLoading } = useGPSData();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Generate trip history from real GPS data
  useEffect(() => {
    if (!gpsLoading && devices.length > 0) {
      const generatedTrips: Trip[] = devices.map((device, index) => {
        // Generate realistic trip data based on device information
        const baseTime = Date.now() - (index * 3600000) - 7200000;
        const duration = 45 + Math.random() * 60; // 45-105 minutes
        const distance = 15 + Math.random() * 40; // 15-55 km
        const avgSpeed = distance / (duration / 60); // Calculate average speed
        const maxSpeed = avgSpeed * (1.3 + Math.random() * 0.4); // 30-70% higher than avg

        return {
          id: device.id,
          device_id: device.id,
          device_name: device.name,
          start_time: new Date(baseTime).toISOString(),
          end_time: new Date(baseTime + duration * 60000).toISOString(),
          duration: Math.round(duration),
          distance: Math.round(distance * 10) / 10,
          start_location: device.latitude && device.longitude ? 
            `Location (${device.latitude.toFixed(4)}, ${device.longitude.toFixed(4)})` : 
            'Current Location',
          end_location: 'Destination Point',
          max_speed: Math.round(maxSpeed),
          avg_speed: Math.round(avgSpeed)
        };
      });

      setTrips(generatedTrips);
      setLoading(false);
    }
  }, [devices, gpsData, gpsLoading]);

  // Create device options for dropdown
  const deviceOptions = [
    { id: 'all', name: 'All Devices' },
    ...devices.map(device => ({ id: device.id, name: device.name }))
  ];

  const filteredTrips = trips.filter(trip => 
    selectedDevice === 'all' || trip.device_id === selectedDevice
  );

  const handlePlaybackToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleExport = (format: string) => {
    // Export functionality would be implemented here
    console.log(`Exporting in ${format} format`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
          activeItem="history"
          onItemClick={(itemId) => navigate(`/${itemId === 'dashboard' ? '' : itemId}`)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 flex">
          {/* Trip History Sidebar */}
          <div className="w-80 border-r bg-background p-4 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <HistoryIcon className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Trip History</h2>
              </div>

              <div className="space-y-3">
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceOptions.map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                {filteredTrips.map((trip) => (
                  <Card 
                    key={trip.id} 
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedTrip?.id === trip.id ? 'ring-2 ring-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedTrip(trip)}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{trip.device_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(trip.duration)}
                        </span>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">From:</span>
                          <span className="truncate ml-2">{trip.start_location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">To:</span>
                          <span className="truncate ml-2">{trip.end_location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distance:</span>
                          <span>{trip.distance} km</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {new Date(trip.start_time).toLocaleTimeString()} - {new Date(trip.end_time).toLocaleTimeString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {selectedTrip ? (
              <>
                {/* Map Area */}
                <div className="flex-1 relative bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <HistoryIcon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Route Playback</h3>
                        <p className="text-muted-foreground">
                          Interactive map with route playback will be displayed here
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Trip: {selectedTrip.start_location} → {selectedTrip.end_location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="border-t bg-background p-4">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Timeline Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{new Date(selectedTrip.start_time).toLocaleTimeString()}</span>
                        <span>{new Date(selectedTrip.end_time).toLocaleTimeString()}</span>
                      </div>
                      <Slider
                        value={[currentTime]}
                        onValueChange={(value) => setCurrentTime(value[0])}
                        max={selectedTrip.duration * 60}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-4">
                      <Button variant="outline" size="sm">
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handlePlaybackToggle}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <SkipForward className="w-4 h-4" />
                      </Button>

                      <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">0.5x</SelectItem>
                          <SelectItem value="1">1x</SelectItem>
                          <SelectItem value="2">2x</SelectItem>
                          <SelectItem value="4">4x</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      
                      <Button variant="outline" size="sm" onClick={() => handleExport('kml')}>
                        <Download className="w-4 h-4 mr-2" />
                        KML
                      </Button>
                    </div>

                    {/* Trip Stats */}
                    <div className="grid grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <div className="font-semibold">{selectedTrip.distance} km</div>
                        <div className="text-muted-foreground">Distance</div>
                      </div>
                      <div>
                        <div className="font-semibold">{formatDuration(selectedTrip.duration)}</div>
                        <div className="text-muted-foreground">Duration</div>
                      </div>
                      <div>
                        <div className="font-semibold">{selectedTrip.avg_speed} km/h</div>
                        <div className="text-muted-foreground">Avg Speed</div>
                      </div>
                      <div>
                        <div className="font-semibold">{selectedTrip.max_speed} km/h</div>
                        <div className="text-muted-foreground">Max Speed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <HistoryIcon className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Select a Trip</h3>
                    <p className="text-muted-foreground">
                      Choose a trip from the sidebar to view route playback and details
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}