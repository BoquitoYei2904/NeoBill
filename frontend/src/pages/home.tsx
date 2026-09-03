import { useEffect, useState } from "react"
import { LicitationsApi } from "../services/licitationsApi"
import { PaymentsApi } from "../services/paymentsApi"
import { formatCurrency } from "../components/globalComponents"

type SummaryCard = {
  title: string;
  amount: number;
};

export default function Home() {

  const [licitations, setLicitations] = useState(0)
  const [active, setActive] = useState(0)
  const [payment, setPayment] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data on mount and when type changes
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const LicitationData = await LicitationsApi().listSummarized()
      const activeData = LicitationData.filter((item) => item.status === "borrador" || item.status === "activa" || item.status === "finalizada" )
      const readyData = LicitationData.filter((item) => item.status === "por_cobrar" )
      const PaymentData = await PaymentsApi().listSummary()
      setLicitations(activeData.reduce((sum, item) => sum + Number(item.presupuesto), 0))
      setActive(readyData.reduce((sum, item) => sum + Number(item.total), 0))
      setPayment(PaymentData.reduce((sum, item) => sum + Number(item.monto), 0))
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchData()
  }, [])
    

  if (loading) {
    return <div className="p-4">Cargando...</div>
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-white p-8">
        <p className="text-sm text-red-500">
          {error}
        </p>
      </div>
    )
  }

  return (
    <SummaryCards
      cards={[
        { title: "Licitado", amount: licitations },
        { title: "Facturado", amount: active },
        { title: "Cobrado", amount: payment },
      ]}
    />
  )}

  function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {card.title}
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900">
            {formatCurrency(card.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}