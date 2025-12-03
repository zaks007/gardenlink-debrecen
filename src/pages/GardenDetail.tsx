import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Leaf, Users, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

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
  owner_id: string;
}

interface Owner {
  id: string;
  full_name: string;
  email: string;
}

const GardenDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [months, setMonths] = useState([3]);
  const [isBooking, setIsBooking] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGarden();
    }
  }, [id]);

  const fetchGarden = async () => {
    try {
      const { data, error } = await supabase
        .from('gardens')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setGarden(data);

      // Fetch owner info
      if (data.owner_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', data.owner_id)
          .single();
        
        if (ownerData) {
          setOwner(ownerData);
        }
      }
    } catch (error) {
      toast.error('Failed to load garden details');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = garden ? garden.base_price_per_month * months[0] : 0;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to make a booking');
      navigate('/auth');
      return;
    }

    // Validate card details
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      toast.error('Card number must be 16 digits');
      return;
    }

    const [expMonth, expYear] = expDate.split('/');
    const currentYear = new Date().getFullYear();
    const year = parseInt('20' + expYear);
    const month = parseInt(expMonth);

    if (year < currentYear || (year === currentYear && month < new Date().getMonth() + 1)) {
      toast.error('Card has expired');
      return;
    }

    if (year < 2026) {
      toast.error('Expiration year must be 2026 or later');
      return;
    }

    if (month < 1 || month > 12) {
      toast.error('Invalid expiration month');
      return;
    }

    if (cvv.length !== 3) {
      toast.error('CVV must be 3 digits');
      return;
    }

    setIsBooking(true);

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months[0]);

      const { error } = await supabase
        .from('bookings')
        .insert({
          garden_id: garden?.id,
          user_id: user.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          duration_months: months[0],
          total_price: totalPrice,
          status: 'confirmed',
          payment_method: 'credit_card',
        });

      if (error) {
        if (error.message.includes('one_booking_per_user_garden')) {
          toast.error('You already have a booking for this garden');
        } else {
          throw error;
        }
      } else {
        toast.success('Booking confirmed! Payment processed successfully.');
        setIsDialogOpen(false);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error: any) {
      toast.error('Failed to create booking');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-5xl mx-auto py-12 px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!garden) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-6xl mx-auto py-12 px-4">
        {/* Garden Images */}
        <div className="relative h-96 rounded-xl overflow-hidden mb-8 shadow-[var(--shadow-medium)]">
          {garden.images && garden.images.length > 0 ? (
            <img
              src={garden.images[0]}
              alt={garden.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage to-forest flex items-center justify-center">
              <Leaf className="h-32 w-32 text-white/30" />
            </div>
          )}
          {garden.available_plots === 0 && (
            <Badge className="absolute top-4 right-4 bg-destructive text-lg py-2 px-4">
              Fully Booked
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Garden Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{garden.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(garden.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg hover:text-primary hover:underline transition-colors"
                >
                  {garden.address}
                </a>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>About this Garden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{garden.description}</p>
                
                {garden.size_sqm && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Size:</span>
                    <span>{garden.size_sqm} m²</span>
                  </div>
                )}

                {garden.amenities && garden.amenities.length > 0 && (
                  <div>
                    <span className="font-semibold mb-2 block">Amenities:</span>
                    <div className="flex flex-wrap gap-2">
                      {garden.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary">{amenity}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {owner && (
              <Card>
                <CardHeader>
                  <CardTitle>Garden Owner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{owner.full_name}</p>
                      <a 
                        href={`mailto:${owner.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {owner.email}
                      </a>
                    </div>
                    {user && user.id !== owner.id && (
                      <Button
                        onClick={() => navigate(`/profile/${owner.id}`)}
                        variant="outline"
                      >
                        View Profile
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-[var(--shadow-medium)]">
              <CardHeader>
                <CardTitle>
                  {garden.base_price_per_month} Ft/month
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {garden.available_plots} of {garden.total_plots} plots available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    Booking Duration: {months[0]} month{months[0] > 1 ? 's' : ''}
                  </Label>
                  <Slider
                    value={months}
                    onValueChange={setMonths}
                    min={1}
                    max={12}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1 month</span>
                    <span>12 months</span>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base price</span>
                    <span>{garden.base_price_per_month} Ft/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{months[0]} months</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{totalPrice} Ft</span>
                  </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full h-12 text-lg"
                      disabled={garden.available_plots === 0}
                      onClick={() => {
                        if (!user) {
                          toast.error('Please sign in to make a booking');
                          navigate('/auth');
                        }
                      }}
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      {garden.available_plots === 0 ? 'Fully Booked' : 'Reserve Plot'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete Your Booking</DialogTitle>
                      <DialogDescription>
                        Enter your payment details to confirm the reservation
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBooking} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="card-number">
                          <CreditCard className="inline h-4 w-4 mr-2" />
                          Card Number
                        </Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, '');
                            if (value.length <= 16 && /^\d*$/.test(value)) {
                              const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                              setCardNumber(formatted);
                            }
                          }}
                          required
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="exp-date">Expiry Date</Label>
                          <Input
                            id="exp-date"
                            placeholder="MM/YY"
                            value={expDate}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 4) {
                                const formatted = value.length >= 2 
                                  ? `${value.slice(0, 2)}/${value.slice(2)}` 
                                  : value;
                                setExpDate(formatted);
                              }
                            }}
                            required
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 3) {
                                setCvv(value);
                              }
                            }}
                            required
                            maxLength={3}
                          />
                        </div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between font-semibold">
                          <span>Total Amount</span>
                          <span className="text-primary">{totalPrice} Ft</span>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isBooking}>
                        {isBooking ? 'Processing...' : 'Confirm & Pay'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenDetail;
