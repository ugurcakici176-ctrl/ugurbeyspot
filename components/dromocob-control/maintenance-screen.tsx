export default function MaintenanceScreen() {
  return (
    <main className="dromocob-control-screen dromocob-maintenance-screen">
      <div className="dromocob-control-grid" />

      <div className="dromocob-control-orbit orbit-one" />
      <div className="dromocob-control-orbit orbit-two" />

      <section className="dromocob-control-content">
        <div className="dromocob-control-status">
          <i />
          SCHEDULED MAINTENANCE
        </div>

        <p className="dromocob-control-brand">
          UĞURBEY SPOT
        </p>

        <h1>
          Daha iyi
          <br />
          bir deneyim
          <br />
          <em>hazırlıyoruz.</em>
        </h1>

        <p className="dromocob-control-description">
          Sistemimiz kısa süreliğine
          bakım modunda. Dijital
          altyapımız üzerinde gerekli
          iyileştirmeleri tamamlıyoruz.
        </p>

        <div className="dromocob-control-footer">
          <span>
            SYSTEM CONTROLLED BY
          </span>

          <strong>
            DROMOCOB
          </strong>
        </div>
      </section>
    </main>
  );
}