import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <SignUp />
    </main>
  )
}
