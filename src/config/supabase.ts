import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fnnsqhpifmxslcxurcdd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZubnNxaHBpZm14c2xjeHVyY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzYyODEsImV4cCI6MjA4MzA1MjI4MX0.CQXyDUdDyaq-OKS5NITWk9D25Z-YN-8Vh6kiGlsU868'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
