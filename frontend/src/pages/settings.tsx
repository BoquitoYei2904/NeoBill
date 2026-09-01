import { useState } from 'react'
import ConfigurationTable from '../components/settings/ConfigurationsTable'

import type {  ConfigurationType } from '../type/Configurations'

const tabs: {
  id: ConfigurationType
  label: string
}[] = [
  {
    id: 'users',
    label: 'Usuarios',
  },
  {
    id: 'clientTypes',
    label: 'Tipos de clientes',
  },
  {
    id: 'taxTypes',
    label: 'Tipos de impuesto',
  },
  {
    id: 'discountOptions',
    label: 'Opciones de descuento',
  },
]

export default function Settings() {
  const [activeTab, setActiveTab] =
    useState<ConfigurationType>('users')


  return (
    <>
      <div className="space-y-5">

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative
                  whitespace-nowrap
                  px-4
                  pb-3
                  text-[10px]
                  font-semibold
                  transition
                  ${
                    isActive
                      ? 'text-[#0b9f7d]'
                      : 'text-slate-400 hover:text-slate-600'
                  }
                `}
              >
                {tab.label}

                {isActive && (
                  <span className="
                    absolute
                    inset-x-0
                    bottom-0
                    h-0.5
                    bg-[#0bc99b]"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Table */}
        <ConfigurationTable
          type={activeTab}
        />

      </div>

    </>
  )
}