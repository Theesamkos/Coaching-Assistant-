export default function Footer() {
  const currentYear = new Date().getFullYear()
  const version = '1.0.0'

  return (
    <footer className="mt-auto py-4 px-6 border-t border-slate-700 bg-slate-900/50">
      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-slate-400 gap-2">
        <div>
          © {currentYear} CoachingAsst. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span>v{version}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-xs">Built for hockey coaches</span>
        </div>
      </div>
    </footer>
  )
}
