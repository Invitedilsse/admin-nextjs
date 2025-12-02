export async function convertBlob(data, fileName) {
  alert('h111i')
  const url = window.URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function convertBase64Blob(base64, fileName) {
  const binary = Buffer.from(base64, 'base64')
  const blob = new Blob([binary], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  // Create download link
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'export.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
