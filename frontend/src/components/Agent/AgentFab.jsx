// /frontend/src/components/Agent/AgentFab.jsx
import "./Agent.css";

export default function AgentFab({ open, onOpen }) {
  if (open) return null;
  return (
    <button className="agent-fab" onClick={onOpen} title="AI Concierge">
      <i className="bi bi-robot" style={{ fontSize: 22 }} />
    </button>
  );
}
