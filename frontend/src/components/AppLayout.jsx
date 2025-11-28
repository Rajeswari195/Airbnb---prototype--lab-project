import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AgentFab from "./Agent/AgentFab";
import AgentPanel from "./Agent/AgentPanel";

export default function AppLayout({ children }) {
  const [agentOpen, setAgentOpen] = useState(false);

  return (
    <div className="app-shell">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <AgentFab open={agentOpen} onOpen={() => setAgentOpen(true)} />
      <AgentPanel open={agentOpen} onClose={() => setAgentOpen(false)} />
    </div>
  );
}
