// Dentro da função handleFileSelect
const reader = new FileReader();
reader.onloadend = async () => {
  const base64String = reader.result as string;
  try {
    // ⚠️ O segredo está aqui: Await para esperar a IA processar
    await onScanComplete(base64String); 
  } catch (error) {
    console.error("Erro na análise:", error);
  } finally {
    // Só encerra o loading e fecha o modal após o sucesso ou erro final
    setIsScanning(false);
    onOpenChange(false);
  }
};