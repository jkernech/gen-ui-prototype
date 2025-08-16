import { StockCard } from '@/components/tools/stock-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { ToolUIPart } from 'ai';

export type StockToolInput = {
  symbol: string;
  numOfMonths: number;
};

export type StockToolOutput = {
  date: string;
  value: number;
}[];

export type StockToolUIPart = ToolUIPart<{
  showStockInformation: {
    input: StockToolInput;
    output: StockToolOutput;
  };
}>;

export function Stock({
  symbol,
  stockData,
}: {
  symbol: string;
  stockData: { date: string; value: number }[];
}) {
  return <StockCard symbol={symbol} data={stockData} />;
}

export function StockLoader() {
  return (
    <Card className="mx-auto my-6 animate-pulse border shadow-md w-full">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-40 rounded bg-gray-300" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="mt-1 h-4 w-64 rounded bg-gray-300" />
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">
              <Skeleton className="h-8 w-full rounded bg-gray-300" />
            </TabsTrigger>
            <TabsTrigger value="summary">
              <Skeleton className="h-8 w-full rounded bg-gray-300" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Skeleton className="h-[300px] w-full rounded bg-gray-300" />
          </TabsContent>

          <TabsContent value="summary" className="space-y-2">
            <Skeleton className="mx-auto h-4 w-1/2 rounded bg-gray-300" />
            <Skeleton className="mx-auto h-4 w-1/3 rounded bg-gray-300" />
            <Skeleton className="mx-auto h-4 w-1/4 rounded bg-gray-300" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
