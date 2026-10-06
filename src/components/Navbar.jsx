import { Calendar, Users, Ticket, BarChart3 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'pembeli', label: 'Pembeli', icon: Users },
    { id: 'tiket', label: 'Tiket', icon: Ticket },
    { id: 'rekap', label: 'Rekap', icon: BarChart3 },
  ];

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-title">
            <img
              src="/logo.png?v=2"
              alt="Logo Karsa Tiket"
              style={{
                width: '34px',
                height: '34px',
                objectFit: 'contain'
              }}
            />
            <span style={{ fontWeight: 700, fontSize: '18px' }}>Karsa Tiket</span>
          </div>

          <nav className="desktop-nav navbar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
