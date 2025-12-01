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
import { Plus, Trash2, Edit, MapPin, Upload, X, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  images?: string[];
  amenities?: string[];
  size_sqm?: number;
}

const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [reserversDialogOpen, setReserversDialogOpen] = useState(false);
  const [selectedGardenReservers, setSelectedGardenReservers] = useState<{name: string; email: string}[]>([]);
  const [selectedGardenName, setSelectedGardenName] = useState('');
  const [isLoadingReservers, setIsLoadingReservers] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    base_price_per_month: '',
    total_plots: '',
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

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('garden-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('garden-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setImageFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      latitude: '',
      longitude: '',
      base_price_per_month: '',
      total_plots: '',
      amenities: '',
      size_sqm: '',
    });
    setImageFiles([]);
    setExistingImages([]);
    setEditingGarden(null);
  };

  const handleEdit = (garden: Garden) => {
    setEditingGarden(garden);
    setFormData({
      name: garden.name,
      description: garden.description,
      address: garden.address,
      latitude: garden.latitude.toString(),
      longitude: garden.longitude.toString(),
      base_price_per_month: garden.base_price_per_month.toString(),
      total_plots: garden.total_plots.toString(),
      amenities: garden.amenities?.join(', ') || '',
      size_sqm: garden.size_sqm?.toString() || '',
    });
    setExistingImages(garden.images || []);
    setImageFiles([]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Upload new images if any
      const newImageUrls = imageFiles.length > 0 ? await uploadImages() : [];
      const allImages = [...existingImages, ...newImageUrls];

      const gardenData: any = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        base_price_per_month: parseFloat(formData.base_price_per_month),
        total_plots: parseInt(formData.total_plots),
        images: allImages.length > 0 ? allImages : null,
      };

      if (!editingGarden) {
        gardenData.owner_id = user?.id;
        gardenData.available_plots = parseInt(formData.total_plots);
      }

      // Parse amenities (comma-separated)
      if (formData.amenities.trim()) {
        gardenData.amenities = formData.amenities.split(',').map(a => a.trim()).filter(a => a);
      }

      // Add size if provided
      if (formData.size_sqm.trim()) {
        gardenData.size_sqm = parseFloat(formData.size_sqm);
      }

      if (editingGarden) {
        const { error } = await supabase
          .from('gardens')
          .update(gardenData)
          .eq('id', editingGarden.id);
        if (error) throw error;
        toast.success('Garden updated successfully!');
      } else {
        const { error } = await supabase.from('gardens').insert(gardenData);
        if (error) throw error;
        toast.success('Garden added successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMyGardens();
    } catch (error: any) {
      toast.error(editingGarden ? 'Failed to update garden' : 'Failed to add garden');
      console.error(error);
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

  const handleShowReservers = async (garden: Garden) => {
    setSelectedGardenName(garden.name);
    setIsLoadingReservers(true);
    setReserversDialogOpen(true);
    
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('garden_id', garden.id)
        .eq('status', 'confirmed');

      if (error) throw error;

      if (bookings && bookings.length > 0) {
        const userIds = bookings.map(b => b.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        setSelectedGardenReservers(profiles?.map(p => ({ name: p.full_name, email: p.email })) || []);
      } else {
        setSelectedGardenReservers([]);
      }
    } catch (error) {
      toast.error('Failed to load reservers');
      setSelectedGardenReservers([]);
    } finally {
      setIsLoadingReservers(false);
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
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Garden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingGarden ? 'Edit Garden' : 'Add New Garden'}</DialogTitle>
                <DialogDescription>
                  {editingGarden ? 'Update the details for this garden' : 'Fill in the details for the new community garden'}
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
                    <Label htmlFor="price">Base Price (Ft/month) *</Label>
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
                  <Label>Garden Images</Label>
                  
                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {existingImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img src={url} alt={`Garden ${index + 1}`} className="w-full h-24 object-cover rounded" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Image Files Preview */}
                  {imageFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Upload ${index + 1}`} 
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImageFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File Upload Button */}
                  <div>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Images
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to select images from your device (max 5MB each)
                    </p>
                  </div>
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
                  {isSaving ? (editingGarden ? 'Updating...' : 'Adding...') : (editingGarden ? 'Update Garden' : 'Add Garden')}
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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(garden)}
                        className="text-primary hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(garden.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {garden.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-semibold">{garden.base_price_per_month} Ft/mo</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Plots:</span>
                      <p className="font-semibold">
                        {garden.available_plots}/{garden.total_plots} available
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => handleShowReservers(garden)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Show Reservers
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reservers Dialog */}
        <Dialog open={reserversDialogOpen} onOpenChange={setReserversDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Reservers for {selectedGardenName}</DialogTitle>
              <DialogDescription>
                People who have reserved plots in this garden
              </DialogDescription>
            </DialogHeader>
            {isLoadingReservers ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : selectedGardenReservers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No reservations yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGardenReservers.map((reserver, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{reserver.name}</TableCell>
                      <TableCell>{reserver.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
