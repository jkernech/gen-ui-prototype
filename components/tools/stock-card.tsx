'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';

export function StockCard({
  symbol,
  data,
}: {
  symbol: string;
  data: { date: string; value: number }[];
}) {
  const chartConfig = {
    value: { label: symbol, color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  return (
    <Card className="mx-auto my-6 max-w-xl">
      <CardHeader>
        <CardTitle>
          {symbol} – Last {data.length} Months
        </CardTitle>
        <CardDescription>
          Beautiful insights and interactive stats.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Line Chart</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            {/* Direct child, no wrapper */}
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart
                data={data}
                margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val) => `$${val}`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(val) => `$${val}`} />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="summary">
            <div className="space-y-2 text-center">
              <div className="font-semibold text-lg">
                Avg: $
                {(
                  data.reduce((sum, p) => sum + p.value, 0) / data.length
                ).toFixed(2)}
              </div>
              <div className="text-muted-foreground text-sm">
                Highest value: ${Math.max(...data.map((d) => d.value))}
              </div>
              <div className="text-muted-foreground text-sm">
                Lowest value: ${Math.min(...data.map((d) => d.value))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-right">
        <span className="text-muted-foreground text-xs">Updated just now</span>
      </CardFooter>
    </Card>
  );
}
