import ClientsTable from "../components/clients/ClientsTable";
import { clients } from "../data/clients";

export default function Clients() {
  return (
    <ClientsTable
      clients={clients}
    />
  )}