
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, userProfile, loading } = useAuth();

  console.log('AdminLayout - loading:', loading);
  console.log('AdminLayout - user:', user?.id);
  console.log('AdminLayout - userProfile:', userProfile);

  // Show loading while authentication is being resolved
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">Loading admin panel...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Authentication Required</h2>
            <p className="text-muted-foreground">You need to be logged in to access the admin panel.</p>
            <a 
              href="/auth" 
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user doesn't have admin privileges
  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
            <p className="text-muted-foreground">
              Admin privileges required to access this page.
            </p>
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Current Role:</strong> {userProfile?.role || 'No profile found'}</p>
            </div>
            <a 
              href="/" 
              className="inline-block bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
            >
              Return to Home
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has admin role - render the admin content
  return <>{children}</>;
}
