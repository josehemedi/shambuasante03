import { useEffect, useState } from "react"

import { useRolePath } from "@/hooks/useRolePath"

import { FlaskConical, FileSignature, Loader2, Plus, Printer, Save, Stethoscope, Trash2 } from "lucide-react"

import Swal from "sweetalert2"

import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui/primitives"

import { useI18n } from "@/i18n/I18nProvider"

import { consultationService } from "@/services/api"
import ConsultationSignatureModal from "@/components/ConsultationSignatureModal"



const DEFAULT_ANALYSIS_TYPES = [

  "Hémogramme (NFS)",

  "Glycémie",

  "Bilan lipidique",

  "TSH",

  "Créatinine",

  "Urée",

  "ECBU",

  "Radiographie",

  "Échographie",

  "ECG",

]



function emptyAnalysis() {

  return { typeAnalyse: "", resultat: "", notes: "" }

}



function toFormValue(value) {

  return value == null ? "" : String(value)

}



export default function TeleconsultationClinicalPanel({ idRdv, patientName, motif, enabled, sessionReady = true }) {

  const { t } = useI18n()

  const { go } = useRolePath()

  const [loading, setLoading] = useState(false)

  const [saving, setSaving] = useState(false)

  const [printing, setPrinting] = useState(false)

  const [signatureOpen, setSignatureOpen] = useState(false)

  const [verifiedMedicalInfo, setVerifiedMedicalInfo] = useState(false)

  const [loadError, setLoadError] = useState("")

  const [fiche, setFiche] = useState(null)



  const [weight, setWeight] = useState("")

  const [height, setHeight] = useState("")

  const [bloodPressure, setBloodPressure] = useState("")

  const [temperature, setTemperature] = useState("")

  const [heartRate, setHeartRate] = useState("")

  const [diagnosis, setDiagnosis] = useState("")

  const [observations, setObservations] = useState("")

  const [analyses, setAnalyses] = useState([emptyAnalysis()])



  useEffect(() => {

    if (!enabled || !idRdv || !sessionReady) return



    let active = true

    setLoading(true)

    setLoadError("")

    consultationService

      .openFicheByRdv(idRdv)

      .then((data) => {

        if (!active) return

        applyFiche(data, patientName, motif)

      })

      .catch((err) => {

        if (!active) return

        const message = err?.payload?.message || err?.message || t("tele.consultSheet.loadError")

        setLoadError(message)

      })

      .finally(() => {

        if (active) setLoading(false)

      })



    return () => {

      active = false

    }

  }, [enabled, idRdv, patientName, motif, sessionReady, t])



  function retryLoad() {

    if (!idRdv) return

    setLoading(true)

    setLoadError("")

    consultationService

      .openFicheByRdv(idRdv)

      .then((data) => applyFiche(data, patientName, motif))

      .catch((err) => setLoadError(err?.payload?.message || err?.message || t("tele.consultSheet.loadError")))

      .finally(() => setLoading(false))

  }



  function applyFiche(data, fallbackPatient, fallbackMotif) {

    setFiche(data)

    setWeight(toFormValue(data.poids))

    setHeight(toFormValue(data.taille))

    setBloodPressure(data.tensionArterielle || "")

    setTemperature(toFormValue(data.temperature))

    setHeartRate(toFormValue(data.frequenceCardiaque))

    setDiagnosis(data.diagnostic || "")

    setObservations(data.observations || "")

    setAnalyses(

      data.analyses?.length

        ? data.analyses.map((a) => ({

            typeAnalyse: a.typeAnalyse || "",

            resultat: a.resultat || "",

            notes: a.notes || "",

          }))

        : [emptyAnalysis()],

    )

    if (!data.nomPatient && fallbackPatient) {

      setFiche((prev) => ({ ...prev, nomPatient: fallbackPatient, motifVisite: data.motifVisite || fallbackMotif }))

    }

  }



  function buildPayload(finaliser = false) {
    return {
      poids: weight ? Number(weight) : null,
      taille: height ? Number.parseInt(height, 10) : null,
      tensionArterielle: bloodPressure || null,
      temperature: temperature ? Number(temperature) : null,
      frequenceCardiaque: heartRate ? Number.parseInt(heartRate, 10) : null,
      diagnostic: diagnosis || null,
      observations: observations || null,
      analyses: analyses
        .filter((a) => a.typeAnalyse?.trim() || a.resultat?.trim() || a.notes?.trim())
        .map((a) => ({
          typeAnalyse: a.typeAnalyse.trim(),
          resultat: a.resultat.trim(),
          notes: a.notes.trim(),
        })),
      finaliser,
    }
  }



  function updateAnalysis(index, field, value) {

    setAnalyses((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))

  }



  function addAnalysis() {

    setAnalyses((prev) => [...prev, emptyAnalysis()])

  }



  function removeAnalysis(index) {

    setAnalyses((prev) => (prev.length <= 1 ? [emptyAnalysis()] : prev.filter((_, i) => i !== index)))

  }



  function fillAnalysisType(index, type) {

    updateAnalysis(index, "typeAnalyse", type)

  }



  async function persistFiche(finaliser = false) {
    if (!fiche?.idConsultation) return null
    const updated = await consultationService.saveFiche(fiche.idConsultation, buildPayload(finaliser))
    applyFiche(updated, patientName, motif)
    return updated
  }



  async function handleSave() {

    if (!fiche?.idConsultation) return



    setSaving(true)
    try {
      await persistFiche(true)
      const result = await Swal.fire({

        icon: "success",

        title: t("tele.consultSheet.saveSuccessTitle"),

        text: t("tele.consultSheet.saveSuccess"),

        confirmButtonText: t("tele.consultSheet.viewRecords"),

        showCancelButton: true,

        cancelButtonText: t("common.close"),

      })

      if (result.isConfirmed) {

        go("/records")

      }

    } catch (err) {

      await Swal.fire({ icon: "error", title: t("common.error"), text: err?.message || t("tele.consultSheet.saveError") })

    } finally {

      setSaving(false)

    }

  }



  async function handlePrint() {

    if (!fiche?.idConsultation) return



    setPrinting(true)

    try {

      if (fiche?.statut !== "SIGNEE") {
        await persistFiche(false)
      }
      await consultationService.downloadFichePdf(fiche.idConsultation)

    } catch (err) {

      await Swal.fire({

        icon: "error",

        title: t("common.error"),

        text: err?.message || t("tele.consultSheet.printPdfError"),

      })

    } finally {

      setPrinting(false)

    }

  }



  async function handleOpenSignature() {
    if (!fiche?.idConsultation || fiche?.statut === "SIGNEE") return
    try {
      await persistFiche(false)
      setSignatureOpen(true)
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("tele.consultSheet.saveError"),
      })
    }
  }

  function handleSigned(result) {
    setVerifiedMedicalInfo(false)
    setFiche((prev) => ({
      ...prev,
      statut: "SIGNEE",
      dateSignature: result?.dateSignature,
      referenceSignature: result?.referenceSignature,
      hashAbrege: result?.hashAbrege,
      nomMedecin: result?.nomMedecin || prev?.nomMedecin,
      numeroOrdreMedecin: result?.numeroOrdre,
    }))
  }

  const isSigned = fiche?.statut === "SIGNEE"
  const analysesSummary = analyses
    .filter((a) => a.typeAnalyse?.trim())
    .map((a) => a.typeAnalyse.trim())
    .join(", ")
  const canSign =
    Boolean(fiche?.idConsultation) &&
    !isSigned &&
    Boolean(diagnosis?.trim()) &&
    verifiedMedicalInfo &&
    !loading &&
    !saving &&
    !printing

  if (!enabled) return null



  return (

    <>

    <Card>

      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">

        <CardTitle className="flex items-center gap-2 text-base">

          <Stethoscope className="h-4 w-4 text-primary" />

          {t("tele.consultSheet.panelTitle")}

        </CardTitle>

        <div className="flex flex-wrap gap-2">

          <Button

            size="sm"

            variant="outline"

            onClick={handlePrint}

            disabled={loading || printing || saving || !fiche?.idConsultation}

          >

            {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}

            {t("tele.consultSheet.print")}

          </Button>

          <Button size="sm" onClick={handleSave} disabled={loading || saving || printing || !fiche?.idConsultation || isSigned}>

            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}

            {t("tele.consultSheet.save")}

          </Button>

        </div>

      </CardHeader>



      <CardContent className="space-y-5">

        {loadError && (

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">

            <p>{loadError}</p>

            <Button size="sm" variant="outline" className="mt-3" onClick={retryLoad}>

              {t("common.refresh")}

            </Button>

          </div>

        )}

        {loading ? (

          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">

            <Loader2 className="h-4 w-4 animate-spin" />

            {t("common.loading")}

          </div>

        ) : (

          <>

            <div>

              <p className="mb-2 text-sm font-semibold text-foreground">{t("tele.consultSheet.vitals")}</p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

                <Input placeholder={t("workspace.weight")} value={weight} onChange={(e) => setWeight(e.target.value)} />

                <Input placeholder={t("workspace.height")} value={height} onChange={(e) => setHeight(e.target.value)} />

                <Input placeholder={t("workspace.bloodPressure")} value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} />

                <Input placeholder={t("workspace.temperature")} value={temperature} onChange={(e) => setTemperature(e.target.value)} />

                <Input placeholder={t("workspace.heartRate")} value={heartRate} onChange={(e) => setHeartRate(e.target.value)} />

              </div>

            </div>



            <div>

              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">

                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">

                  <FlaskConical className="h-4 w-4 text-primary" />

                  {t("tele.consultSheet.analyses")}

                </p>

                <Button size="sm" variant="outline" onClick={addAnalysis}>

                  <Plus className="h-3.5 w-3.5" />

                  {t("tele.consultSheet.addAnalysis")}

                </Button>

              </div>



              <div className="space-y-3">

                {analyses.map((row, index) => (

                  <div key={index} className="rounded-xl border border-border p-3">

                    <div className="mb-2 flex flex-wrap gap-1.5">

                      {DEFAULT_ANALYSIS_TYPES.slice(0, 5).map((type) => (

                        <button

                          key={type}

                          type="button"

                          onClick={() => fillAnalysisType(index, type)}

                          className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"

                        >

                          {type}

                        </button>

                      ))}

                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-12">

                      <Input

                        className="md:col-span-4"

                        placeholder={t("tele.consultSheet.analysisType")}

                        value={row.typeAnalyse}

                        onChange={(e) => updateAnalysis(index, "typeAnalyse", e.target.value)}

                      />

                      <Input

                        className="md:col-span-3"

                        placeholder={t("tele.consultSheet.analysisResult")}

                        value={row.resultat}

                        onChange={(e) => updateAnalysis(index, "resultat", e.target.value)}

                      />

                      <Input

                        className="md:col-span-4"

                        placeholder={t("tele.consultSheet.analysisNotes")}

                        value={row.notes}

                        onChange={(e) => updateAnalysis(index, "notes", e.target.value)}

                      />

                      <Button

                        type="button"

                        size="icon"

                        variant="ghost"

                        className="md:col-span-1 text-destructive"

                        onClick={() => removeAnalysis(index)}

                        aria-label={t("tele.consultSheet.removeAnalysis")}

                      >

                        <Trash2 className="h-4 w-4" />

                      </Button>

                    </div>

                  </div>

                ))}

              </div>

            </div>



            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>

                <label className="text-sm font-medium text-muted-foreground">{t("workspace.diagnosis")}</label>

                <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="mt-1" />

              </div>

              <div>

                <label className="text-sm font-medium text-muted-foreground">{t("workspace.observations")}</label>

                <textarea

                  value={observations}

                  onChange={(e) => setObservations(e.target.value)}

                  rows={3}

                  className="mt-1 h-auto w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"

                />

              </div>

            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">{t("signature.summaryPanelTitle")}</p>
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t("workspace.diagnosis")}</dt>
                  <dd className="font-medium">{diagnosis || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("signature.traitement")}</dt>
                  <dd className="font-medium">{analysesSummary || "—"}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-muted-foreground">{t("workspace.observations")}</dt>
                  <dd className="font-medium whitespace-pre-wrap">{observations || "—"}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-muted-foreground">{t("signature.ordonnance")}</dt>
                  <dd className="font-medium">—</dd>
                </div>
              </dl>

              {isSigned ? (
                <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">{t("signature.signedBadge")}</p>
                  <p className="mt-1">{t("signature.signedBy")} {fiche?.nomMedecin || "—"}</p>
                  <p>{t("signature.signedAt")} {fiche?.dateSignature || "—"}</p>
                  <p>{t("signature.reference")} {fiche?.referenceSignature || "—"}</p>
                </div>
              ) : (
                <>
                  <label className="mt-4 flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={verifiedMedicalInfo}
                      onChange={(e) => setVerifiedMedicalInfo(e.target.checked)}
                      disabled={isSigned}
                    />
                    <span>{t("signature.verifyCheckbox")}</span>
                  </label>
                  <Button
                    className="mt-4"
                    onClick={handleOpenSignature}
                    disabled={!canSign}
                  >
                    <FileSignature className="h-4 w-4" />
                    {t("signature.signButton")}
                  </Button>
                  {!diagnosis?.trim() && (
                    <p className="mt-2 text-xs text-muted-foreground">{t("signature.diagnosticRequired")}</p>
                  )}
                </>
              )}
            </div>
          </>

        )}

      </CardContent>

    </Card>

    <ConsultationSignatureModal
      isOpen={signatureOpen}
      onClose={() => setSignatureOpen(false)}
      fiche={fiche}
      summary={{
        diagnostic: diagnosis,
        observations: observations,
        ordonnance: "—",
        traitement: analysesSummary,
      }}
      onSigned={handleSigned}
    />

    </>

  )
}


