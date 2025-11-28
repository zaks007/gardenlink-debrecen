import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Euro } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  total_price: number;
  status: string;
  garden: {
    name: string;
    address: string;
  };
}

const Profile = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchBookings();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) setFullName(data.full_name);
    } catch (error) {
      console.error('Failed to load profile');
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          garden:gardens(name, address)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Booking cancelled');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to cancel booking');
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
      
      <div className="container max-w-5xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div>
                      <Badge variant={isAdmin ? 'default' : 'secondary'}>
                        {isAdmin ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Bookings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>View and manage your garden reservations</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">No bookings yet</p>
                    <Button onClick={() => navigate('/')}>Browse Gardens</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">
                                {booking.garden.name}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                <MapPin className="h-3 w-3" />
                                {booking.garden.address}
                              </p>
                            </div>
                            <Badge
                              variant={
                                booking.status === 'confirmed'
                                  ? 'default'
                                  : booking.status === 'cancelled'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-muted-foreground">Duration:</span>
                              <p className="font-semibold">{booking.duration_months} months</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total:</span>
                              <p className="font-semibold flex items-center gap-1">
                                <Euro className="h-3 w-3" />
                                {booking.total_price}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Start:</span>
                              <p className="font-semibold">
                                {new Date(booking.start_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">End:</span>
                              <p className="font-semibold">
                                {new Date(booking.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {booking.status === 'confirmed' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel Booking
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
