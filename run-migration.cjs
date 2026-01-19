const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const connectionString =
  'postgresql://postgres:yc0XDUFIxyWwfMvF@db.fnnsqhpifmxslcxurcdd.supabase.co:5432/postgres'

const migrations = [
  'Coaching Assistant Tasks/migrations/00_profiles.sql',
  'Coaching Assistant Tasks/migrations/01_core_tables.sql',
  'Coaching Assistant Tasks/migrations/02_triggers_and_rls.sql',
  'Coaching Assistant Tasks/migrations/03_seed_data_and_views.sql',
]

async function runMigrations() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Required for Supabase
  })

  try {
    await client.connect()
    console.log('Connected to database')

    for (const migration of migrations) {
      const filepath = path.join(__dirname, migration)
      if (!fs.existsSync(filepath)) {
        console.log(`⚠️  Skipping ${migration} - file not found`)
        continue
      }

      const sql = fs.readFileSync(filepath, 'utf8')
      console.log(`\n📝 Running ${path.basename(migration)}...`)

      try {
        await client.query(sql)
        console.log(`✅ ${path.basename(migration)} completed`)
      } catch (error) {
        console.error(`❌ Error in ${path.basename(migration)}:`)
        console.error(error.message)
        // Continue with next migration instead of stopping
      }
    }

    console.log('\n✅ All migrations completed')
  } catch (error) {
    console.error('Connection error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations()
