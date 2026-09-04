// Evolution API Client v2 - Academia do Gol (Cantina & Bar)
// Suporta envio 100% automático de WhatsApp sem custo de mensagem

const EVOLUTION_URL =
  process.env.EVOLUTION_API_URL || 'https://extras-identified-frontier-toys.trycloudflare.com'
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'acadgol_evolution_secret_2026'
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'academiadogol'

export async function sendEvolutionWhatsApp({
  phone,
  message,
}: {
  phone: string
  message: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`
    }

    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_KEY,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: message,
        options: {
          delay: 1200,
          presence: 'composing',
        },
      }),
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Evolution API HTTP ${res.status}: ${errText}` }
    }

    const data = await res.json()
    return { success: true, messageId: data?.key?.id }
  } catch (err: any) {
    console.warn('Evolution API indisponível ou offline:', err.message)
    return { success: false, error: err.message }
  }
}
