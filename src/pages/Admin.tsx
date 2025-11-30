import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Garden {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  base_price_per_month: number;
  total_plots: number;
  available_plots: number;
}

const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    base_price_per_month: '',
    total_plots: '',
    images: '',
    amenities: '',
    size_sqm: '',
  });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchMyGardens();
    }
  }, [user, isAdmin]);

  const fetchMyGardens = async () => {
    try {
      const { data, error } = await supabase
        .from('gardens')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGardens(data || []);
    } catch (error) {
      toast.error('Failed to load gardens');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const gardenData: any = {
        owner_id: user?.id,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        base_price_per_month: parseFloat(formData.base_price_per_month),
        total_plots: parseInt(formData.total_plots),
        available_plots: parseInt(formData.total_plots),
      };

      // Parse images (comma-separated URLs)
      if (formData.images.trim()) {
        gardenData.images = formData.images.split(',').map(url => url.trim()).filter(url => url);
      }

      // Parse amenities (comma-separated)
      if (formData.amenities.trim()) {
        gardenData.amenities = formData.amenities.split(',').map(a => a.trim()).filter(a => a);
      }

      // Add size if provided
      if (formData.size_sqm.trim()) {
        gardenData.size_sqm = parseFloat(formData.size_sqm);
      }

      const { error } = await supabase.from('gardens').insert(gardenData);

      if (error) throw error;

      toast.success('Garden added successfully!');
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        base_price_per_month: '',
        total_plots: '',
        images: '',
        amenities: '',
        size_sqm: '',
      });
      fetchMyGardens();
    } catch (error: any) {
      toast.error('Failed to add garden');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (gardenId: string) => {
    if (!confirm('Are you sure you want to delete this garden?')) return;

    try {
      const { error } = await supabase.from('gardens').delete().eq('id', gardenId);

      if (error) throw error;

      toast.success('Garden deleted successfully');
      fetchMyGardens();
    } catch (error) {
      toast.error('Failed to delete garden');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Garden Management</h1>
            <p className="text-muted-foreground">Manage your community gardens</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Garden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Garden</DialogTitle>
                <DialogDescription>
                  Fill in the details for the new community garden
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Garden Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., Nagyerdő, Debrecen"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude *</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="47.5316"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude *</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="21.6273"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Base Price (€/month) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price_per_month}
                      onChange={(e) => setFormData({ ...formData, base_price_per_month: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plots">Total Plots *</Label>
                    <Input
                      id="plots"
                      type="number"
                      min="1"
                      value={formData.total_plots}
                      onChange={(e) => setFormData({ ...formData, total_plots: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Plot Size (m²)</Label>
                  <Input
                    id="size"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.size_sqm}
                    onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Image URLs</Label>
                  <Textarea
                    id="images"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder="Enter DIRECT image URLs separated by commas&#10;e.g., https://images.unsplash.com/photo-123/garden.jpg, https://example.com/image2.jpg"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Use direct image URLs only (ending in .jpg, .png, etc.). Right-click an image and select "Copy image address" - don't use Google Images links!
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amenities">Amenities</Label>
                  <Input
                    id="amenities"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    placeholder="e.g., Water access, Tool shed, Composting area"
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple amenities with commas</p>
                </div>

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? 'Adding...' : 'Add Garden'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {gardens.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MapPin className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No gardens yet</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first garden</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Garden
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gardens.map((garden) => (
              <Card key={garden.id} className="hover:shadow-[var(--shadow-medium)] transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{garden.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {garden.address}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(garden.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {garden.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-semibold">€{garden.base_price_per_month}/mo</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Plots:</span>
                      <p className="font-semibold">
                        {garden.available_plots}/{garden.total_plots} available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
