/*==========================================================
    VISTA PREVIA DE ARCHIVOS ADJUNTOS
==========================================================*/

// Manejar la selección de archivos y mostrar/ocultar botón de vista previa
function handleFileSelect(input, btnId) {
  const previewBtn = document.getElementById(btnId)

  if (input.files && input.files[0]) {
    previewBtn.style.display = "flex"
  } else {
    previewBtn.style.display = "none"
  }
}

// Previsualizar archivo (imagen o PDF)
function previewFile(inputId, title) {
  const input = document.getElementById(inputId)
  const modal = document.getElementById("imagePreviewModal")
  const previewImage = document.getElementById("previewImage")
  const pdfPreview = document.getElementById("pdfPreview")
  const pdfFileName = document.getElementById("pdfFileName")
  const previewTitle = document.getElementById("previewTitle")

  if (input.files && input.files[0]) {
    const file = input.files[0]
    const fileType = file.type

    // Actualizar título del modal
    previewTitle.textContent = title

    // Verificar si es una imagen o PDF
    if (fileType.startsWith("image/")) {
      // Es una imagen
      const reader = new FileReader()

      reader.onload = (e) => {
        previewImage.src = e.target.result
        previewImage.style.display = "block"
        pdfPreview.classList.remove("active")
        modal.classList.add("active")
      }

      reader.readAsDataURL(file)
    } else if (fileType === "application/pdf") {
      // Es un PDF
      previewImage.style.display = "none"
      pdfPreview.classList.add("active")
      pdfFileName.textContent = file.name
      modal.classList.add("active")
    }
  }
}

// Cerrar modal de vista previa
function closeImagePreview() {
  const modal = document.getElementById("imagePreviewModal")
  modal.classList.remove("active")
}

// Cerrar modal al hacer clic fuera del contenido
document.getElementById("imagePreviewModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeImagePreview()
  }
})

// Cerrar modal con la tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeImagePreview()
  }
})
