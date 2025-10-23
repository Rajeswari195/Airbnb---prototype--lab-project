import "./HostModal.css";

export default function HostModal({ onClose }) {
  const handleChoose = () => onClose();
  return (
    <div className="host-modal-backdrop">
      <div className="host-modal-card">
        <button
          className="btn btn-link text-dark host-close"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="bi bi-x-lg"></i>
        </button>

        <h2 className="text-center mb-4">What would you like to host?</h2>

        <div className="container">
          <div className="row g-4">
            <div className="col-12 col-md-4">
              <button className="host-card w-100" onClick={handleChoose}>
                <i className="bi bi-house-door-fill host-icon"></i>
                <div className="host-title">Home</div>
              </button>
            </div>

            <div className="col-12 col-md-4">
              <button className="host-card w-100" onClick={handleChoose}>
                <i className="bi bi-balloon-heart-fill host-icon"></i>
                <div className="host-title">Experience</div>
              </button>
            </div>

            <div className="col-12 col-md-4">
              <button className="host-card w-100" onClick={handleChoose}>
                <i className="bi bi-bell-fill host-icon"></i>
                <div className="host-title">Service</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
