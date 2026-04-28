"use client";

import { Button } from "@/components/ui/Button";

export function DataExportButton() {
  function handleExport() {
    window.location.href = "/api/lgpd/export";
  }

  return (
    <Button onClick={handleExport} variant="secondary">
      Exportar meus dados
    </Button>
  );
}
