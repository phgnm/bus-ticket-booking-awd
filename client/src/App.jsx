import { useState } from 'react'
import { Button } from '@/components/ui/button'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex min-h-svh flex-col items-center justify-center">
      <Button className='text-amber-950'>Click me</Button>
      <h1>cc</h1>
    </div>
    </>
  )
}

export default App
