import { useProduct, usePriceHistory } from '@/hooks/useProducts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface ProductPriceChartProps {
  productId: string;
}

export default function ProductPriceChart({ productId }: ProductPriceChartProps) {
  const { data: product, isLoading: productLoading } = useProduct(productId);
  const firstLinkId = product?.product_links?.[0]?.id;
  const { data: history, isLoading: historyLoading } = usePriceHistory(firstLinkId || '');

  if (productLoading || historyLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No price history yet</p>
          <p className="text-sm text-muted-foreground">
            Price history is recorded when you refresh prices
          </p>
        </div>
      </div>
    );
  }

  const chartData = history.map((h) => ({
    date: format(new Date(h.recorded_at), 'MMM d'),
    price: h.price,
  }));

  const prices = history.map((h) => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currentPrice = prices[prices.length - 1];
  const firstPrice = prices[0];

  const priceChange = currentPrice - firstPrice;
  const percentChange = ((priceChange / firstPrice) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Current</p>
          <p className="font-medium">₹{currentPrice.toLocaleString()}</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Lowest</p>
          <p className="font-medium text-success">₹{minPrice.toLocaleString()}</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Highest</p>
          <p className="font-medium text-destructive">₹{maxPrice.toLocaleString()}</p>
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center justify-center gap-2">
        {priceChange < 0 ? (
          <>
            <TrendingDown className="h-5 w-5 text-success" />
            <span className="text-success font-medium">
              ₹{Math.abs(priceChange).toLocaleString()} ({Math.abs(parseFloat(percentChange))}% down)
            </span>
          </>
        ) : priceChange > 0 ? (
          <>
            <TrendingUp className="h-5 w-5 text-destructive" />
            <span className="text-destructive font-medium">
              ₹{priceChange.toLocaleString()} ({percentChange}% up)
            </span>
          </>
        ) : (
          <>
            <Minus className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">No change</span>
          </>
        )}
        <span className="text-muted-foreground text-sm">since tracking started</span>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="date" 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                      <p className="font-medium">₹{payload[0].value?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(var(--foreground))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {currentPrice === minPrice && (
        <div className="text-center p-3 bg-success/10 text-success rounded-lg text-sm font-medium">
          🎉 Currently at the lowest recorded price!
        </div>
      )}
    </div>
  );
}
