export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body
  const correctPassword = process.env.APP_PASSWORD || 'voozaa2024'

  if (password === correctPassword) {
    res.status(200).json({ success: true })
  } else {
    res.status(401).json({ error: 'Invalid password' })
  }
}
