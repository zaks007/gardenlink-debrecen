import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Leaf, Euro, Users, Map } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';
import GardenMap from '@/components/GardenMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Garden {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  base_price_per_month: number;
  available_plots: number;
  total_plots: number;
  size_sqm: number | null;
  amenities: string[] | null;
  images: string[] | null;
}

const Home = () => {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGardens();
  }, []);

  const fetchGardens = async () => {
    try {
      const { data, error } = await supabase
        .from('gardens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGardens(data || []);
    } catch (error: any) {
      toast.error('Failed to load gardens');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGardens = gardens.filter(garden =>
    garden.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garden.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-sage/20 to-background">
        <div className="container max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-2 mb-6 rounded-full bg-primary/10">
            <Leaf className="h-6 w-6 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">Debrecen's Garden Community</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-forest bg-clip-text text-transparent">
            Find Your Perfect Garden Plot
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore community gardens across Debrecen, book plots, and connect with fellow gardeners
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search gardens by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg shadow-[var(--shadow-soft)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gardens Section */}
      <section className="container max-w-7xl mx-auto py-12 px-4">
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Map View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0">
            {!isLoading && <GardenMap gardens={filteredGardens} onGardenClick={(id) => navigate(`/garden/${id}`)} />}
          </TabsContent>

          <TabsContent value="grid">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredGardens.length === 0 ? (
          <div className="text-center py-16">
            <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-semibold mb-2">No gardens found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'Check back soon for new gardens!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGardens.map((garden) => (
              <Card
                key={garden.id}
                className="group hover:shadow-[var(--shadow-medium)] transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => navigate(`/garden/${garden.id}`)}
              >
                <div className="relative h-48 bg-gradient-to-br from-sage to-forest overflow-hidden">
                  {garden.images && garden.images.length > 0 ? (
                    <img
                      src={garden.images[0]}
                      alt={garden.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="h-16 w-16 text-white/50" />
                    </div>
                  )}
                  {garden.available_plots === 0 && (
                    <Badge className="absolute top-3 right-3 bg-destructive">Fully Booked</Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                    {garden.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{garden.address}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {garden.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{garden.available_plots}/{garden.total_plots} available</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <Euro className="h-4 w-4" />
                      <span>{garden.base_price_per_month}/mo</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled={garden.available_plots === 0}>
                    {garden.available_plots === 0 ? 'Fully Booked' : 'View Details'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Home;
