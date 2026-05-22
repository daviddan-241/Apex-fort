import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateProject, useGenerateProject, useUploadFile } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { 
  Rocket, 
  Terminal, 
  Upload, 
  FileBox, 
  Image as ImageIcon, 
  Film, 
  X,
  Loader2,
  Crosshair,
  Shield,
  Smartphone,
  Sword,
  Car,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  platform: z.string().default("PC"),
  features: z.array(z.string()).default([]),
});

const featureOptions = [
  { id: "multiplayer", label: "Multiplayer" },
  { id: "raytracing", label: "Raytracing (RTX)" },
  { id: "open_world", label: "Open World" },
  { id: "procedural_generation", label: "Procedural Generation" },
  { id: "vr_support", label: "VR Support" },
  { id: "save_system", label: "Save/Load System" },
  { id: "battle_pass", label: "Battle Pass" },
  { id: "crossplay", label: "Cross-Platform Play" },
];

const GAME_PRESETS = [
  {
    id: "battle-royale",
    label: "Battle Royale",
    sub: "Fortnite / PUBG",
    icon: Shield,
    color: "from-purple-500/20 to-blue-500/20 border-purple-500/40 hover:border-purple-400",
    activeColor: "from-purple-500/40 to-blue-500/40 border-purple-400",
    textColor: "text-purple-400",
    prompt: "A 100-player battle royale game with a shrinking storm circle, parachute drop onto a large island map, loot system with weapon rarities (Common to Legendary), building mechanics, supply drops, and Epic Online Services multiplayer. Support 60fps on PC and console.",
    features: ["multiplayer", "battle_pass", "crossplay"],
    platform: "PC",
  },
  {
    id: "fps",
    label: "FPS Multiplayer",
    sub: "Call of Duty-style",
    icon: Crosshair,
    color: "from-orange-500/20 to-red-500/20 border-orange-500/40 hover:border-orange-400",
    activeColor: "from-orange-500/40 to-red-500/40 border-orange-400",
    textColor: "text-orange-400",
    prompt: "A fast-paced military FPS with team deathmatch and domination modes. 64-player dedicated servers, weapon classes (AR, SMG, Sniper, Shotgun, Pistol), killstreak rewards (UAV, Airstrike, Chopper Gunner), sprint/slide/prone movement, prestige progression, and operator customization.",
    features: ["multiplayer", "save_system", "crossplay"],
    platform: "PC",
  },
  {
    id: "mobile",
    label: "Mobile Shooter",
    sub: "iOS / Android",
    icon: Smartphone,
    color: "from-pink-500/20 to-cyan-500/20 border-pink-500/40 hover:border-pink-400",
    activeColor: "from-pink-500/40 to-cyan-500/40 border-pink-400",
    textColor: "text-pink-400",
    prompt: "A mobile battle royale shooter for iOS and Android. Virtual joystick controls, auto-fire system, gyroscope aiming, battle pass with premium cosmetics, in-app purchases, 60-player matches on a mid-sized map, optimized for 60fps on iPhone 13+ and mid-range Android devices.",
    features: ["multiplayer", "battle_pass"],
    platform: "Mobile",
  },
  {
    id: "rpg",
    label: "Open World RPG",
    sub: "Elden Ring / Skyrim",
    icon: Sword,
    color: "from-green-500/20 to-emerald-500/20 border-green-500/40 hover:border-green-400",
    activeColor: "from-green-500/40 to-emerald-500/40 border-green-400",
    textColor: "text-green-400",
    prompt: "A dark fantasy open-world RPG with a massive seamless world. Deep NPC dialogue with branching quests, skill trees, crafting, dungeon crawling, boss battles, faction reputation system, day/night cycle with NPC schedules, and atmospheric Lumen lighting.",
    features: ["open_world", "save_system", "procedural_generation"],
    platform: "PC",
  },
  {
    id: "racing",
    label: "Racing Game",
    sub: "Forza / Need for Speed",
    icon: Car,
    color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/40 hover:border-yellow-400",
    activeColor: "from-yellow-500/40 to-orange-500/40 border-yellow-400",
    textColor: "text-yellow-400",
    prompt: "An arcade-style racing game with 20 licensed-style cars, drift mechanics, nitro boost, online multiplayer races with 16 players, multiple track environments (city, mountains, desert), car customization, and a career mode with championship seasons.",
    features: ["multiplayer", "save_system"],
    platform: "PC",
  },
  {
    id: "custom",
    label: "Custom Game",
    sub: "Your own idea",
    icon: Zap,
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/40 hover:border-cyan-400",
    activeColor: "from-cyan-500/40 to-blue-500/40 border-cyan-400",
    textColor: "text-cyan-400",
    prompt: "",
    features: [],
    platform: "PC",
  },
];

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Parse initial prompt from URL
  const searchParams = new URLSearchParams(window.location.search);
  const initialPrompt = searchParams.get("prompt") || "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: initialPrompt,
      platform: "PC",
      features: [],
    },
  });

  const createProject = useCreateProject();
  const generateProject = useGenerateProject();
  const uploadFile = useUploadFile();

  const applyPreset = (presetId: string) => {
    const preset = GAME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    if (preset.prompt) {
      form.setValue("prompt", preset.prompt);
    }
    if (preset.platform) {
      form.setValue("platform", preset.platform);
    }
    if (preset.features.length > 0) {
      form.setValue("features", preset.features);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllFiles = async (): Promise<string[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    const uploadedIds: string[] = [];

    for (const file of files) {
      try {
        const result = await uploadFile.mutateAsync({
          data: { file: file as unknown as Blob },
        });
        uploadedIds.push(result.id);
      } catch (error) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setIsUploading(false);
    return uploadedIds;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 1. Upload files first if any
      let fileIds: string[] = [];
      if (files.length > 0) {
        fileIds = await uploadAllFiles();
        if (fileIds.length === 0) {
          throw new Error("Failed to upload any files");
        }
      }

      // 2. Create project
      const project = await createProject.mutateAsync({
        data: {
          prompt: values.prompt,
          platform: values.platform,
          features: values.features,
          uploadedFileIds: fileIds.length > 0 ? fileIds : undefined,
        }
      });

      // 3. Start generation pipeline
      await generateProject.mutateAsync({ id: project.id });

      toast({
        title: "Build initialized",
        description: "The swarm is waking up. Redirecting to Studio...",
      });

      // 4. Redirect to studio
      setLocation(`/studio/${project.id}`);
      
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Failed to initialize",
        description: "An error occurred while setting up the project.",
        variant: "destructive",
      });
    }
  }

  const isSubmitting = createProject.isPending || generateProject.isPending || isUploading;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8"
      >
        <div className="border-b border-border/50 pb-6">
          <h1 className="text-3xl font-bold tracking-tight font-mono flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" />
            Initialize Build
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure parameters for the AI agents to begin architectural planning and generation.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Game Type Presets */}
            <div className="space-y-4">
              <div>
                <p className="text-base font-bold font-mono text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Select Game Type
                </p>
                <p className="text-sm text-muted-foreground mt-1">Choose a genre preset or describe your own below.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GAME_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isActive = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`relative text-left p-4 rounded-xl border bg-gradient-to-br transition-all duration-200 group ${isActive ? preset.activeColor : preset.color} focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${preset.textColor}`} />
                      <p className="font-bold text-sm text-foreground">{preset.label}</p>
                      <p className={`text-xs mt-0.5 ${preset.textColor}`}>{preset.sub}</p>
                      {isActive && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-background" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold font-mono text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    System Prompt
                  </FormLabel>
                  <FormDescription>
                    Describe the game in detail. The more specific you are about mechanics, art style, and mood, the better the result.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="A stylized 3D platformer where you play as a sentient toaster..."
                      className="min-h-[200px] font-mono text-sm resize-y bg-card/50 focus-visible:ring-primary/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Target Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card/50">
                          <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PC">PC (Windows)</SelectItem>
                        <SelectItem value="Console">Console (PS5/Xbox Series)</SelectItem>
                        <SelectItem value="Mobile">Mobile (iOS/Android)</SelectItem>
                        <SelectItem value="VR">Virtual Reality</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features"
                render={() => (
                  <FormItem>
                    <FormLabel className="font-bold">System Features</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {featureOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="features"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-3 bg-card/20 hover:bg-card/50 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer text-sm">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-3">
              <p className="text-base font-bold font-mono">Reference Assets (Optional)</p>
              <p className="text-sm text-muted-foreground">
                Upload concept art, moodboards, GDD documents, or audio references to guide the agents.
              </p>
              
              <div 
                className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-card/20 hover:bg-card/40 hover:border-primary/50 transition-all cursor-pointer relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input 
                  id="file-upload" 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Drag & Drop assets</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Support for images (JPG/PNG), videos (MP4), documents (PDF/TXT), and ZIP archives.
                </p>
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card relative group">
                      <div className="w-8 h-8 rounded bg-background flex flex-shrink-0 items-center justify-center">
                        {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-accent" /> :
                         file.type.startsWith('video/') ? <Film className="w-4 h-4 text-secondary" /> :
                         <FileBox className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border flex justify-end">
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="font-bold shadow-[0_0_20px_rgba(0,255,255,0.2)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Initializing Systems...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Execute Build
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
