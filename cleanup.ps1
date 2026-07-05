# BlogHub cleanup — removes dead/legacy files left over from the old project.
# Safe to run once from the project root:  ./cleanup.ps1
# Each item is only deleted if it exists.

$ErrorActionPreference = 'SilentlyContinue'

$targets = @(
  # duplicate / old entry points
  'server.js',

  # old server-rendered EJS system (the app is now static HTML + API)
  'views',

  # old auth/session system (replaced by middleware/auth.js JWT)
  'config\passport.js',
  'config\auth.js',

  # controllers were unused
  'controllers',

  # models no longer used (comments & likes are embedded in Blog now)
  'models\Comment.js',
  'models\Category.js',
  'models\Contact.js',

  # dead / duplicate route files
  'routes\api.js',
  'routes\index.js',
  'routes\dashboard.js',
  'routes\users.js',

  # legacy frontend pages
  'public\debug.html',
  'public\forgot-password.html',
  'public\contact.html',
  'public\partials',

  # legacy / superseded frontend scripts
  'public\js\main.js',
  'public\js\auth.js',
  'public\js\blog.js',
  'public\js\blog-list.js',
  'public\js\contact.js',
  'public\js\profile.js',
  'public\js\three-hero.js',
  'public\js\hero-3d.js',
  'public\js\hero-canvas.js',

  # old CSS that was @imported by the previous stylesheet
  'public\css\colors.css'
)

$removed = 0
foreach ($t in $targets) {
  $path = Join-Path $PSScriptRoot $t
  if (Test-Path $path) {
    Remove-Item -Recurse -Force $path
    Write-Host "removed  $t" -ForegroundColor DarkGray
    $removed++
  }
}

Write-Host ""
Write-Host "Done. $removed item(s) removed." -ForegroundColor Green
Write-Host "Note: 'npm install' will prune old packages from package.json on its own." -ForegroundColor DarkGray
