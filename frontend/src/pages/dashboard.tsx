import LicitationsTable from '../components/Licitations/licitationsTable'
import { licitaciones } from '../data/licitaciones'

export default function Dashboard() {
  return (
    <LicitationsTable
      Licitations={licitaciones}
    />
  )
}