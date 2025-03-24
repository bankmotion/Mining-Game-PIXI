
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IncomeForecastProps {
  moneyRate: number;
}

export const IncomeForecast = ({ moneyRate }: IncomeForecastProps) => {
  const [showForecast, setShowForecast] = useState(false);
  
  // Calculate income forecasts
  const perMinute = moneyRate * 60;
  const perHour = perMinute * 60;
  const perDay = perHour * 24;
  
  return (
    <TooltipProvider>
      <Tooltip open={showForecast} onOpenChange={setShowForecast}>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="w-12 h-12 rounded-md hover:bg-primary/20"
          >
            <Clock className="h-6 w-6" />
            <span className="sr-only">Income Forecast</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-60 p-0">
          <div className="bg-secondary rounded-lg p-3 w-full">
            <h3 className="font-bold mb-2 pixel-font text-center">Income Forecast</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Per second:</span>
                <span className="font-mono text-yellow-400">${formatNumber(moneyRate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Per minute:</span>
                <span className="font-mono text-yellow-400">${formatNumber(perMinute)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Per hour:</span>
                <span className="font-mono text-yellow-400">${formatNumber(perHour)}</span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-sm">Per day:</span>
                <span className="font-mono text-yellow-400">${formatNumber(perDay)}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
