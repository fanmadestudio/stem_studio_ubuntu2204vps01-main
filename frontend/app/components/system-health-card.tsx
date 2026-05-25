type ApiStatus = "Online" | "Offline" | "Checking";

type SystemHealthCardProps = {
  apiStatus: ApiStatus;
  lastSync: string;
};

export function SystemHealthCard({ apiStatus, lastSync }: SystemHealthCardProps) {
  return (
    <article className="card">
      <h3>4. System Health</h3>
      <table className="table" style={{ marginTop: 8 }}>
        <tbody>
          <tr>
            <td>API Status</td>
            <td>
              <span className={apiStatus === "Online" ? "status ok" : apiStatus === "Checking" ? "status warn" : "status danger"}>{apiStatus}</span>
            </td>
          </tr>
          <tr>
            <td>Failed Jobs / Reminders</td>
            <td>0 detected</td>
          </tr>
          <tr>
            <td>Last Sync Time</td>
            <td>{lastSync}</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
