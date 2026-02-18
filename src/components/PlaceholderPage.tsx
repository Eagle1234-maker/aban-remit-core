import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
    <Card>
      <CardContent className="p-12 flex flex-col items-center justify-center text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-display font-semibold mb-2">Under Development</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          This feature is currently being built and will be available soon.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default PlaceholderPage;
