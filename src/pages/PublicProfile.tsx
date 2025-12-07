import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userApi, gardenApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, MapPin, Leaf } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface Garden {
  id: string;
  name: string;
  address: string;
  basePricePerMonth: number;
  availablePlots: number;
  images: string[] | null;
}

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchGardens();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      const data = await userApi.getById(id!);
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGardens = async () => {
    try {
      const data = await userApi.getGardens(id!);
      setGardens(data);
    } catch (error) {
      console.error('Failed to load gardens');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 px-4 text-center">
          <h2 className="text-2xl font-bold">Profile not found</h2>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin' || profile.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-5xl mx-auto py-12 px-4">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {profile.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.fullName}</h1>
                  {isAdmin && <Badge>Garden Owner</Badge>}
                </div>
                <a 
                  href={`mailto:${profile.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  Contact: {profile.email}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gardens */}
        {gardens.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gardens by {profile.fullName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gardens.map((garden) => (
                  <Card
                    key={garden.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/garden/${garden.id}`)}
                  >
                    <div className="relative h-32 bg-gradient-to-br from-sage to-forest overflow-hidden rounded-t-lg">
                      {garden.images && garden.images.length > 0 ? (
                        <img
                          src={garden.images[0]}
                          alt={garden.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="h-12 w-12 text-white/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-lg mb-2">{garden.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3" />
                        {garden.address}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {garden.availablePlots} plots available
                        </span>
                        <span className="font-semibold text-primary">
                          {garden.basePricePerMonth} Ft/mo
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
