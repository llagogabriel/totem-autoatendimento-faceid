export function handleErrors(err, req, res, next) {
  console.error('❌ Erro:', err.message)
  
  res.status(err.status || 500).json({
    erro: err.message || 'Erro interno do servidor',
    status: err.status || 500
  })
}

export function logRequests(req, res, next) {
  const inicio = Date.now()
  
  res.on('finish', () => {
    const duracao = Date.now() - inicio
    const emoji = res.statusCode >= 400 ? '❌' : '✅'
    console.log(`${emoji} ${req.method} ${req.path} - ${res.statusCode} (${duracao}ms)`)
  })
  
  next()
}

export default { handleErrors, logRequests }
