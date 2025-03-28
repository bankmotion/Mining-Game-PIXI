
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import { Pickaxe, Lock, Check } from 'lucide-react';
import { MineType } from '@/interfaces/MineType';

interface MineSelectorProps {
  mines: Record<string, MineType>;
  activeMine: string;
  money: number;
  onUnlock: (mineId: string) => void;
  onSwitch: (mineId: string) => void;
}

export const MineSelector = ({ 
  mines, 
  activeMine, 
  money, 
  onUnlock, 
  onSwitch 
}: MineSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Pickaxe className="h-5 w-5" />
        <h2 className="text-xl font-bold pixel-font">Mining Locations</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {Object.values(mines).map((mine) => (
          <Card 
            key={mine.id} 
            className={`overflow-hidden transition-all duration-200 ${
              activeMine === mine.id 
                ? 'border-primary border-2' 
                : mine.unlocked 
                  ? 'hover:border-primary/50'
                  : 'opacity-80'
            }`}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{mine.name}</CardTitle>
                {activeMine === mine.id && (
                  <Badge variant="outline" className="bg-primary/20 text-primary">
                    Active
                  </Badge>
                )}
              </div>
              <CardDescription>{mine.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Value Multiplier</span>
                  <span className="font-medium">x{mine.resourceMultiplier}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Rare Ore Chance</span>
                  <span className="font-medium">x{mine.rareOreChance}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-2">
              {!mine.unlocked ? (
                <Button 
                  className="w-full" 
                  variant={money >= mine.cost ? "default" : "outline"}
                  onClick={() => onUnlock(mine.id)}
                  disabled={money < mine.cost}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock for ${formatNumber(mine.cost)}
                </Button>
              ) : activeMine === mine.id ? (
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled
                >
                  <Check className="h-4 w-4 mr-2" />
                  Currently Active
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => onSwitch(mine.id)}
                >
                  Switch to this Mine
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
