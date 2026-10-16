import { BookOpenIcon, HomeIcon, UserRoundIcon } from 'lucide-react';

export type BottomNavigationTab = 'home' | 'collection' | 'profile';

export interface BottomNavigationProps {
  activeTab: BottomNavigationTab;
  onChange: (tab: BottomNavigationTab) => void;
}

const tabs = [
  { id: 'home', label: 'Beranda', icon: HomeIcon },
  { id: 'collection', label: 'Koleksi', icon: BookOpenIcon },
  { id: 'profile', label: 'Profil', icon: UserRoundIcon },
] as const;

export function BottomNavigation({ activeTab, onChange }: BottomNavigationProps) {
  return (
    <nav
      className="h-[calc(72px+env(safe-area-inset-bottom))] shrink-0 border-t-[2.5px] border-ink bg-card px-3 pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-1.5 xl:order-first xl:h-auto xl:w-[120px] xl:border-r-[2.5px] xl:border-t-0 xl:px-3 xl:pb-6 xl:pt-6"
      aria-label="Navigasi utama"
    >
      <ul className="mx-auto grid h-full max-w-xl grid-cols-3 gap-2 xl:h-auto xl:grid-cols-1 xl:gap-3">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <li key={id} className="h-full xl:h-auto">
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 w-full flex-col items-center justify-center rounded-chip border-[2.5px] font-body text-[13px] leading-[18px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-2px] focus-visible:outline-lens xl:min-h-[72px] ${active ? 'border-ink bg-accent font-bold text-ink' : 'border-transparent bg-card font-normal text-muted'}`}
              >
                <Icon size={22} strokeWidth={2.25} aria-hidden="true" />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
