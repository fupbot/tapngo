import { Navigate, Route, Routes } from "react-router-dom"

import { Layout } from "@/components/Layout"
import { ConfirmationPage } from "@/pages/ConfirmationPage"
import { LandingPage } from "@/pages/LandingPage"
import { MenuPage } from "@/pages/MenuPage"
import { PaymentPage } from "@/pages/PaymentPage"

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="confirmation" element={<ConfirmationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
