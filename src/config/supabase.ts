import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fnnsqhpifmxslcxurcdd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZubnNxaHBpZm14c2xjeHVyY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MjQzNjMsImV4cCI6MjA1MjMwMDM2M30.frC-pHpc83FQqN4ew19JQq_OZ2g5UNP_Iq6pDyWYfmE'

if (!supabaseUrl || !supabaseAnonKey ) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
