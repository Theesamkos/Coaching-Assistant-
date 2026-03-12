import { supabase } from '@/config/supabase'

export interface DrillEmailData {
  drillTitle: string
  drillDescription?: string
  drillCategory?: string
  drillDuration?: number
  drillDifficulty?: string
  drillObjectives?: string[]
  coachName: string
}

export const emailService = {
  /**
   * Get all player emails for a coach
   */
  async getCoachPlayerEmails(coachId: string): Promise<{ email: string; name?: string }[]> {
    try {
      const { data, error } = await supabase
        .from('coach_players')
        .select('player_email, player_name')
        .eq('coach_id', coachId)
        .not('player_email', 'is', null)

      if (error || !data) return []

      return data.map((p: any) => ({
        email: p.player_email,
        name: p.player_name || undefined,
      }))
    } catch {
      return []
    }
  },

  /**
   * Send drill notification email via mailto (opens email client)
   */
  sendDrillEmailViaMailto(
    recipients: { email: string; name?: string }[],
    drill: DrillEmailData
  ): void {
    if (recipients.length === 0) return

    const to = recipients.map((r) => r.email).join(',')
    const subject = encodeURIComponent(`New Drill Added: ${drill.drillTitle}`)

    const body = encodeURIComponent(
      `Hi Team,\n\n` +
      `Coach ${drill.coachName} has added a new drill to your training program!\n\n` +
      `🏒 DRILL: ${drill.drillTitle}\n` +
      (drill.drillCategory ? `📂 Category: ${drill.drillCategory}\n` : '') +
      (drill.drillDuration ? `⏱ Duration: ${drill.drillDuration} minutes\n` : '') +
      (drill.drillDifficulty ? `💪 Difficulty: ${drill.drillDifficulty}\n` : '') +
      (drill.drillDescription ? `\n📝 Description:\n${drill.drillDescription}\n` : '') +
      (drill.drillObjectives && drill.drillObjectives.length > 0
        ? `\n🎯 Objectives:\n${drill.drillObjectives.map((o) => `• ${o}`).join('\n')}\n`
        : '') +
      `\nLog in to your CoachingAsst app to view the full drill details and instructions.\n\n` +
      `Best,\nCoach ${drill.coachName}`
    )

    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank')
  },
}
