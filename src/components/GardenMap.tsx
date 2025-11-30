import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Garden {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  available_plots: number;
  base_price_per_month: number;
}

interface GardenMapProps {
  gardens: Garden[];
  onGardenClick?: (gardenId: string) => void;
}

const GardenMap = ({ gardens, onGardenClick }: GardenMapProps) => {
  if (gardens.length === 0) {
    return (
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No gardens to display on map</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={[47.5316, 21.6273]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {gardens.map((garden) => (
          <Marker
            key={garden.id}
            position={[garden.latitude, garden.longitude]}
            eventHandlers={{
              click: () => {
                if (onGardenClick) {
                  onGardenClick(garden.id);
                }
              },
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold mb-1">{garden.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{garden.address}</p>
                <p className="text-sm"><strong>€{garden.base_price_per_month}/mo</strong></p>
                <p className="text-sm">{garden.available_plots} plots available</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default GardenMap;
