import { Outlet } from 'react-router-dom'

import Sidebar from './sidebar'
import Header from './header'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <Sidebar />

      <main className="min-h-screen lg:ml-[228px]">
        <div className="mx-auto max-w-[1280px] px-5 py-7 sm:px-7 lg:px-8">
          <Header />

          <Outlet />
        </div>
      </main>
    </div>
  )
}