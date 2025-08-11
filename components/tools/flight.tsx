import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function Flight({
  flightNumber,
  flightData,
}: {
  flightNumber: string;
  flightData: {
    status: string;
    source: string;
    destination: string;
    departure: string;
    arrival: string;
    gate: string;
    seat: string;
  };
}) {
  return (
    <Card className="mx-auto my-6 max-w-md border shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="font-semibold text-lg">
            {flightData.source} → {flightData.destination}
          </CardTitle>
          <Badge
            variant={flightData.status === 'On Time' ? 'secondary' : 'destructive'}
          >
            {flightData.status}
          </Badge>
        </div>
        <CardDescription className="mt-1 text-gray-500 text-xs">
          Flight {flightNumber}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <p className="text-gray-500 text-xs">Departure</p>
            <p className="font-medium">{flightData.departure}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Arrival</p>
            <p className="font-medium">{flightData.arrival}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Gate</p>
            <p className="font-medium">{flightData.gate}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Seat</p>
            <p className="font-medium">{flightData.seat}</p>
          </div>
        </div>
      </CardContent>

      <div className="border-t" />

      <div className="flex items-center justify-between bg-gray-100 px-4 py-2">
        <Button size="sm" variant="outline">
          View Boarding Pass
        </Button>
        <span className="text-gray-500 text-xs">Boarding Opens Soon</span>
      </div>
    </Card>
  );
}

export function FlightLoader() {
  return (
    <Card className="mx-auto my-6 max-w-md animate-pulse border shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-32 rounded bg-gray-300" />
          <Skeleton className="h-6 w-16 rounded bg-gray-300" />
        </div>
        <Skeleton className="mt-1 h-4 w-24 rounded bg-gray-300" />
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Skeleton className="h-4 w-full rounded bg-gray-300" />
          <Skeleton className="h-4 w-full rounded bg-gray-300" />
          <Skeleton className="h-4 w-full rounded bg-gray-300" />
          <Skeleton className="h-4 w-full rounded bg-gray-300" />
        </div>
      </CardContent>

      <div className="border-t" />
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2">
        <Skeleton className="h-8 w-28 rounded bg-gray-300" />
        <Skeleton className="h-4 w-28 rounded bg-gray-300" />
      </div>
    </Card>
  );
}
