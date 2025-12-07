import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gardenApi, bookingApi, userApi, uploadApi } from '@/lib/api';
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
  basePricePerMonth: number;
  totalPlots: number;
  availablePlots: number;
  images?: string[];
  amenities?: string[];
  sizeSqm?: number;
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
    basePricePerMonth: '',
    totalPlots: '',
    amenities: '',
    sizeSqm: '',
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
      const data = await userApi.getGardens(user?.id || '');
      setGardens(data.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        address: g.address,
        basePricePerMonth: g.basePricePerMonth,
        totalPlots: g.totalPlots,
        availablePlots: g.availablePlots,
        images: g.images || undefined,
        amenities: g.amenities || undefined,
        sizeSqm: g.sizeSqm || undefined,
      })));
    } catch (error) {
      toast.error('Failed to load gardens');
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    
    try {
      return await uploadApi.uploadFiles(imageFiles);
    } catch (error) {
      throw new Error('Failed to upload images');
    }
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
      basePricePerMonth: '',
      totalPlots: '',
      amenities: '',
      sizeSqm: '',
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
      basePricePerMonth: garden.basePricePerMonth.toString(),
      totalPlots: garden.totalPlots.toString(),
      amenities: garden.amenities?.join(', ') || '',
      sizeSqm: garden.sizeSqm?.toString() || '',
    });
    setExistingImages(garden.images || []);
    setImageFiles([]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const newImageUrls = await uploadImages();
      const allImages = [...existingImages, ...newImageUrls];

      const gardenData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        basePricePerMonth: parseFloat(formData.basePricePerMonth),
        totalPlots: parseInt(formData.totalPlots),
        images: allImages.length > 0 ? allImages : null,
        ownerId: user?.id,
        availablePlots: !editingGarden ? parseInt(formData.totalPlots) : undefined,
        amenities: formData.amenities.trim() 
          ? formData.amenities.split(',').map(a => a.trim()).filter(a => a) 
          : null,
        sizeSqm: formData.sizeSqm.trim() ? parseFloat(formData.sizeSqm) : null,
      };

      if (editingGarden) {
        await gardenApi.update(editingGarden.id, gardenData);
        toast.success('Garden updated successfully!');
      } else {
        await gardenApi.create(gardenData);
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
      await gardenApi.delete(gardenId);
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
      const bookings = await bookingApi.getByGarden(garden.id);
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

      if (confirmedBookings.length > 0) {
        const reservers = await Promise.all(
          confirmedBookings.map(async (booking) => {
            try {
              const user = await userApi.getById(booking.userId);
              return { name: user.fullName, email: user.email };
            } catch {
              return { name: 'Unknown', email: '' };
            }
          })
        );
        setSelectedGardenReservers(reservers);
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
                    <Label htmlFor="price">Base Price (Ft/month) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.basePricePerMonth}
                      onChange={(e) => setFormData({ ...formData, basePricePerMonth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plots">Total Plots *</Label>
                    <Input
                      id="plots"
                      type="number"
                      min="1"
                      value={formData.totalPlots}
                      onChange={(e) => setFormData({ ...formData, totalPlots: e.target.value })}
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
                    value={formData.sizeSqm}
                    onChange={(e) => setFormData({ ...formData, sizeSqm: e.target.value })}
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Garden Images</Label>
                  
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
                      Click to select images from your device (max 10MB each)
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
                    <div>
                      <CardTitle className="text-xl">{garden.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {garden.address}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(garden)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(garden.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{garden.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {garden.availablePlots}/{garden.totalPlots} plots available
                    </span>
                    <span className="font-semibold text-primary">{garden.basePricePerMonth} Ft/mo</span>
                  </div>
                  <Button
                    variant="outline"
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reservers for {selectedGardenName}</DialogTitle>
              <DialogDescription>
                Users who have confirmed bookings for this garden
              </DialogDescription>
            </DialogHeader>
            {isLoadingReservers ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : selectedGardenReservers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No reservations yet</div>
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
                      <TableCell>
                        <a href={`mailto:${reserver.email}`} className="text-primary hover:underline">
                          {reserver.email}
                        </a>
                      </TableCell>
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
