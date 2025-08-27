import { redirect } from 'next/navigation'

// ---------- Redirect Home ----------
export default function Index() {
  redirect('/home')
}
