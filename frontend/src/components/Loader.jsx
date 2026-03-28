export default function Loader({ label = "Loading" }) {
  return (
    <div className="loader-shell" role="status" aria-live="polite">
      <div className="loader-ring" />
      <p>{label}</p>
    </div>
  );
}
