export default function DisabledScreen() {
  return (
    <main className="dromocob-control-screen dromocob-disabled-screen">
      <div className="dromocob-control-grid" />

      <section className="dromocob-control-content">
        <div className="dromocob-control-status disabled">
          <i />
          SERVICE SUSPENDED
        </div>

        <p className="dromocob-control-brand">
          UĞURBEY SPOT
        </p>

        <h1>
          Bu servis
          <br />
          şu an
          <br />
          <em>kullanılamıyor.</em>
        </h1>

        <p className="dromocob-control-description">
          Site yönetim sistemi
          tarafından geçici olarak
          devre dışı bırakıldı.
        </p>

        <div className="dromocob-control-footer">
          <span>
            REMOTE OPERATIONS
          </span>

          <strong>
            DROMOCOB CONTROL OS
          </strong>
        </div>
      </section>
    </main>
  );
}