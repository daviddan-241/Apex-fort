import { Navbar } from "@/components/layout/Navbar";
import { useGetConfig, useUpdateConfig } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef } from "react";
import type { EngineConfig, ConfigUpdate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetConfigQueryKey } from "@workspace/api-client-react";

export default function SettingsPage() {
  const { data: serverConfig, isLoading } = useGetConfig();
  const updateConfig = useUpdateConfig();
  const queryClient = useQueryClient();

  // Local state for optimistic UI updates while sliding
  const [localConfig, setLocalConfig] = useState<Partial<EngineConfig>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (serverConfig) {
      setLocalConfig(serverConfig);
    }
  }, [serverConfig]);

  const handleUpdate = (updates: Partial<EngineConfig>) => {
    setLocalConfig((prev) => ({ ...prev, ...updates }));

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce server updates
    updateTimeoutRef.current = setTimeout(() => {
      updateConfig.mutate(
        { data: updates as ConfigUpdate },
        {
          onSuccess: (data) => {
            queryClient.setQueryData(getGetConfigQueryKey(), data);
          },
        }
      );
    }, 500);
  };

  if (isLoading || !localConfig) {
    return (
      <div className="min-h-screen bg-background pt-14 flex items-center justify-center">
        <div className="text-muted-foreground">Loading config...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Engine Settings</h1>
          <p className="text-muted-foreground">Configure game rules and rendering pipeline. Changes apply in real-time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gameplay Settings */}
          <Card className="bg-card/80 border-border/50">
            <CardHeader>
              <CardTitle>Gameplay & Physics</CardTitle>
              <CardDescription>Movement, combat, and world forces.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Movement Speed</Label>
                  <span className="text-xs text-muted-foreground font-mono">{localConfig.movementSpeed} u/s</span>
                </div>
                <Slider
                  min={1} max={20} step={0.5}
                  value={[localConfig.movementSpeed || 5]}
                  onValueChange={([val]) => handleUpdate({ movementSpeed: val })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Jump Height</Label>
                  <span className="text-xs text-muted-foreground font-mono">{localConfig.jumpHeight}</span>
                </div>
                <Slider
                  min={1} max={30} step={1}
                  value={[localConfig.jumpHeight || 10]}
                  onValueChange={([val]) => handleUpdate({ jumpHeight: val })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Gravity</Label>
                  <span className="text-xs text-muted-foreground font-mono">{localConfig.gravity}</span>
                </div>
                <Slider
                  min={5} max={50} step={1}
                  value={[localConfig.gravity || 20]}
                  onValueChange={([val]) => handleUpdate({ gravity: val })}
                />
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Bullet Damage</Label>
                  <span className="text-xs text-muted-foreground font-mono">{localConfig.bulletDamage}</span>
                </div>
                <Slider
                  min={1} max={100} step={1}
                  value={[localConfig.bulletDamage || 25]}
                  onValueChange={([val]) => handleUpdate({ bulletDamage: val })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rendering Settings */}
          <Card className="bg-card/80 border-border/50">
            <CardHeader>
              <CardTitle>Graphics & Rendering</CardTitle>
              <CardDescription>Visual effects and camera pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Camera Mode</Label>
                <Select 
                  value={localConfig.cameraMode} 
                  onValueChange={(v: any) => handleUpdate({ cameraMode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="third_person">Third Person</SelectItem>
                    <SelectItem value="first_person">First Person</SelectItem>
                    <SelectItem value="shoulder">Shoulder Over-the-top</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Field of View (FOV)</Label>
                  <span className="text-xs text-muted-foreground font-mono">{localConfig.fov}°</span>
                </div>
                <Slider
                  min={60} max={120} step={1}
                  value={[localConfig.fov || 75]}
                  onValueChange={([val]) => handleUpdate({ fov: val })}
                />
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between">
                <Label htmlFor="fog">Atmospheric Fog</Label>
                <Switch 
                  id="fog" 
                  checked={localConfig.fogEnabled} 
                  onCheckedChange={(val) => handleUpdate({ fogEnabled: val })}
                />
              </div>
              
              {localConfig.fogEnabled && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground">Fog Density</Label>
                    <span className="text-xs text-muted-foreground font-mono">{localConfig.fogDensity}</span>
                  </div>
                  <Slider
                    min={0.001} max={0.05} step={0.001}
                    value={[localConfig.fogDensity || 0.01]}
                    onValueChange={([val]) => handleUpdate({ fogDensity: val })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="bloom">Bloom Post-Processing</Label>
                <Switch 
                  id="bloom" 
                  checked={localConfig.bloomEnabled} 
                  onCheckedChange={(val) => handleUpdate({ bloomEnabled: val })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="shadows">Real-time Shadows</Label>
                <Switch 
                  id="shadows" 
                  checked={localConfig.shadowsEnabled ?? true} 
                  onCheckedChange={(val) => handleUpdate({ shadowsEnabled: val })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
