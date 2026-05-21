import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import CharactersIndex from "@/pages/characters/index";
import CharacterDetail from "@/pages/characters/detail";
import SystemsIndex from "@/pages/systems/index";
import SystemDetail from "@/pages/systems/detail";
import WeaponsIndex from "@/pages/weapons/index";
import GameModesIndex from "@/pages/gamemodes/index";
import ProgressionIndex from "@/pages/progression/index";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/characters" component={CharactersIndex} />
      <Route path="/characters/:id" component={CharacterDetail} />
      <Route path="/systems" component={SystemsIndex} />
      <Route path="/systems/:id" component={SystemDetail} />
      <Route path="/weapons" component={WeaponsIndex} />
      <Route path="/gamemodes" component={GameModesIndex} />
      <Route path="/progression" component={ProgressionIndex} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;