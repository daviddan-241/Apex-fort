import { useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Upload, X, FolderOpen, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AssetUploader() {
  const { isUploaderOpen, toggleUploader, uploadedModels, addUploadedModel, removeUploadedModel } =
    useGameStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.name.match(/\.(glb|gltf)$/i)) {
        const url = URL.createObjectURL(file);
        addUploadedModel(url);
      }
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach((file) => {
      if (file.name.match(/\.(glb|gltf)$/i)) {
        const url = URL.createObjectURL(file);
        addUploadedModel(url);
      }
    });
  };

  if (!isUploaderOpen) return null;

  return (
    <div className="absolute top-20 right-6 z-50 w-80 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-white font-mono shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#00b4ff]" />
          <span className="text-sm font-bold tracking-widest text-[#00b4ff]">UE5 ASSET LOADER</span>
        </div>
        <button onClick={toggleUploader} className="text-white/40 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[#00b4ff]/40 hover:border-[#00b4ff] rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors mb-4 bg-[#00b4ff]/5 hover:bg-[#00b4ff]/10"
      >
        <Upload className="w-8 h-8 text-[#00b4ff]" />
        <p className="text-xs text-center text-white/70">
          Drop <span className="text-[#00b4ff]">.glb / .gltf</span> files here
        </p>
        <p className="text-[10px] text-white/40">Export from UE5 → File → Export → FBX/GLTF</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf"
        multiple
        className="hidden"
        onChange={handleFile}
      />

      {/* Loaded assets list */}
      {uploadedModels.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-white/40 tracking-widest">LOADED ASSETS ({uploadedModels.length})</p>
          {uploadedModels.map((url, i) => (
            <div
              key={url}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3 h-3 text-[#00b4ff]" />
                <span className="text-xs text-white/70">Asset_{i + 1}.glb</span>
              </div>
              <button
                onClick={() => removeUploadedModel(url)}
                className="text-white/30 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadedModels.length === 0 && (
        <p className="text-[10px] text-white/30 text-center">No assets loaded yet</p>
      )}

      <div className="mt-4 pt-3 border-t border-white/10">
        <p className="text-[10px] text-white/30 leading-relaxed">
          Supports UE5 exported GLB/GLTF with textures, materials, and meshes. Assets appear in-scene at spawn point.
        </p>
      </div>
    </div>
  );
}
