import { createClient } from '@supabase/supabase-js'

// Hardcoded values for production deployment
const supabaseUrl = 'https://fnnsqhpifmxslcxurcdd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZubnNxaHBpZm14c2xjeHVyY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzYyODEsImV4cCI6MjA4MzA1MjI4MX0.CQXyDUdDyaq-OKS5NITWk9D25Z-YN-8Vh6kiGlsU868'

export const supabase = createClient(supabaseUrl, supabaseAnonKey )
