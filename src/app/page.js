export const metadata = {
  title: "RecipeApp - Home",
  description: "Delicious recipes at your fingertips",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-screen-h">
      <header className="mb-section-gap flex justify-between items-center">
        <div>
          <p className="text-sm text-text-secondary">Good morning,</p>
          <h1 className="hero-heading">
            Find Your Next <span className="hero-highlight">Favorite Meal</span>
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden shadow-card">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Search Bar Mockup */}
      <div className="mb-section-gap flex items-center bg-[#F2F2F2] h-12 rounded-search-bar px-4 shadow-sm">
        <span className="text-icon-muted mr-2">🔍</span>
        <span className="text-sm text-icon-muted flex-grow">Search recipes...</span>
        <span className="text-text-primary text-xl">≡</span>
      </div>

      <section>
        <div className="flex justify-between items-center mb-item-gap">
          <h2 className="section-title">Popular Recipes</h2>
          <span className="text-sm font-semibold text-primary">View All</span>
        </div>

        <div className="grid grid-cols-2 gap-item-gap">
          {/* Recipe Card 1 */}
          <div className="recipe-card p-card-p shadow-card rounded-card overflow-hidden">
            <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
              <img 
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop" 
                alt="Recipe" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded-pill text-[10px] font-bold text-text-onPrimary shadow-sm">
                ★ 4.8
              </div>
            </div>
            <h3 className="card-title truncate">Healthy Salmon Bowl</h3>
            <p className="card-subtitle">25 mins • Easy</p>
          </div>

          {/* Recipe Card 2 */}
          <div className="recipe-card p-card-p shadow-card rounded-card overflow-hidden">
            <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
              <img 
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop" 
                alt="Recipe" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded-pill text-[10px] font-bold text-text-onPrimary shadow-sm">
                ★ 4.9
              </div>
            </div>
            <h3 className="card-title truncate">Fresh Berry Pancake</h3>
            <p className="card-subtitle">15 mins • Medium</p>
          </div>
        </div>
      </section>

      {/* FAB Mockup */}
      <button className="fixed bottom-10 right-6 w-14 h-14 bg-primary rounded-full shadow-fab flex items-center justify-center text-2xl transition-transform hover:scale-110 active:scale-95">
        ＋
      </button>

      {/* Bottom Nav Mockup */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-divider flex items-center justify-around px-4 shadow-nav-bar">
        <div className="bg-primary/20 px-5 py-2 rounded-pill flex items-center gap-2">
          <span className="text-primary text-xl">🏠</span>
          <span className="text-xs font-bold text-text-primary">Home</span>
        </div>
        <span className="text-icon-muted text-xl">📖</span>
        <span className="text-icon-muted text-xl">🔖</span>
        <span className="text-icon-muted text-xl">👤</span>
      </nav>
      <div className="h-20" /> {/* Spacer for bottom nav */}
    </div>
  );
}
