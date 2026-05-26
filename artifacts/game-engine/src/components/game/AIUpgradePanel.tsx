import { useState, useRef, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { useListChatMessages, useSendChatMessage, getListChatMessagesQueryKey, getGetConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Send, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AIUpgradePanel() {
  const { isChatOpen, toggleChat } = useGameStore();
  const { data: messages, isLoading } = useListChatMessages();
  const sendMessage = useSendChatMessage();
  const queryClient = useQueryClient();
  
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    sendMessage.mutate(
      { data: { content: input } },
      {
        onSuccess: (newMessage) => {
          setInput("");
          // Invalidate chat to fetch new messages
          queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
          
          // If the AI responded with config changes, we should fetch the latest config
          // (In a real implementation, the backend would update the DB and we refetch)
          if (newMessage.configChanges) {
            queryClient.invalidateQueries({ queryKey: getGetConfigQueryKey() });
          }
        }
      }
    );
  };

  return (
    <div 
      className={cn(
        "absolute top-0 right-0 h-full w-96 bg-black/80 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto",
        isChatOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <h2 className="font-bold tracking-wider text-white">ENGINE TERMINAL</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleChat} className="text-white/50 hover:text-white hover:bg-white/10">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-blue-100">
            <Sparkles className="w-4 h-4 inline mr-2 text-primary" />
            AI Assistant active. Type commands to modify the engine live (e.g. "make it darker", "increase jump height").
          </div>

          {isLoading ? (
            <div className="text-center text-white/40 text-sm py-4 animate-pulse">Initializing terminal...</div>
          ) : messages?.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "p-3 rounded-lg text-sm max-w-[90%]",
                msg.role === 'user' 
                  ? "bg-white/10 ml-auto border border-white/5" 
                  : "bg-black/60 border border-white/10 shadow-md"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="text-xs font-bold text-primary mb-1 tracking-wider uppercase">System AI</div>
              )}
              <div className="text-white/90 leading-relaxed">{msg.content}</div>
              
              {/* Show code badge if config was changed */}
              {msg.configChanges && (
                <div className="mt-2 text-xs font-mono bg-black/80 p-2 rounded text-green-400 border border-green-500/20">
                  {"> Config Updated"}
                </div>
              )}
            </div>
          ))}
          {sendMessage.isPending && (
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-sm w-fit shadow-md">
              <span className="flex items-center gap-1 text-primary">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/40">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type engine command..."
            className="w-full bg-black/50 border-white/20 text-white placeholder:text-white/30 pr-10 focus-visible:ring-primary h-12"
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="absolute right-1 text-white/50 hover:text-primary hover:bg-transparent"
            disabled={!input.trim() || sendMessage.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
