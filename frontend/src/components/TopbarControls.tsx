import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

export function TopbarControls() {
  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <LanguageToggle />
    </div>
  );
}
