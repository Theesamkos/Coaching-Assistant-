import { createClient } from '@supabase/supabase-js'

// Hardcoded values for production deployment
const supabaseUrl = 'https://fnnsqhpifmxslcxurcdd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZubnNxaHBpZm14c2xjeHVyY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MjQzNjMsImV4cCI6MjA1MjMwMDM2M30.frC-pHpc83FQqN4ew19JQq_OZ2g5UNP_Iq6pDyWYfmE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey )
