import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/primitives"
import { Button } from "@/components/ui/primitives"
import { Input } from "@/components/ui/primitives"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"

// Mock data for patients - replace with actual API call
const patients = [
  { id: "PAT001", name: "John Doe" },
  { id: "PAT002", name: "Jane Smith" },
  { id: "PAT003", name: "Peter Jones" },
]

export function BookAppointmentModal({ isOpen, onClose, onConfirm }) {
  const { t } = useI18n()
  const [patientId, setPatientId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [type, setType] = useState("in-person")

  const handleSubmit = () => {
    // Form validation could be added here
    onConfirm({ patientId, date, time, type })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("appointments.book_new")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="patient" className="text-right">
              {t("appointments.patient")}
            </label>
            <Select onValueChange={setPatientId} value={patientId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t("appointments.select_patient")} />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="date" className="text-right">
              {t("appointments.date")}
            </label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="time" className="text-right">
              {t("appointments.time")}
            </label>
            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="type" className="text-right">
              {t("appointments.type")}
            </label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-person">{t("appointments.types.in_person")}</SelectItem>
                <SelectItem value="teleconsultation">{t("appointments.types.teleconsultation")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("common.cancel")}
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>
            {t("appointments.book_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
