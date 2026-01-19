/**
 * Disclaimer Component
 *
 * Displays important disclaimers about the read-only nature of this app.
 * MUST be visible to users at all times.
 */

export function Disclaimer() {
  return (
    <div className="disclaimer">
      <div className="disclaimer-content">
        <h3>SYSTEM NOTICE</h3>
        <ul>
          <li><strong>Read-only demo</strong> - No transactions or signing</li>
          <li><strong>Entertainment only</strong> - Not financial advice</li>
        </ul>
        <p className="disclaimer-footer">
          Public addresses are generated and balances are queried for display only.
        </p>
      </div>
    </div>
  );
}
