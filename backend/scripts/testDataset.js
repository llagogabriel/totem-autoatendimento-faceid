import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import * as faceapi from 'face-api.js'
import canvas from 'canvas'
import { calcularDistanciaEuclidiana } from '../src/services/faceRecognition.js'

const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATASET_DIR = process.env.DATASET_DIR || path.resolve(__dirname, '..', '..', '..', 'datasetVC')
const MODEL_DIR = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'models')
const CSV_OUTPUT_PATH = path.resolve(__dirname, '..', 'dataset_test_results.csv')
const TRAIN_RATIO = 0.8
const NO_PREDICTION = 'NO_PREDICTION'

function readToken(buffer, startIndex) {
  let i = startIndex
  while (i < buffer.length && /[\s\n\r\t]/.test(String.fromCharCode(buffer[i]))) {
    i += 1
  }
  if (buffer[i] === 0x23) {
    while (i < buffer.length && buffer[i] !== 0x0a) i += 1
    return readToken(buffer, i)
  }

  let token = ''
  while (i < buffer.length && !/[\s\n\r\t]/.test(String.fromCharCode(buffer[i]))) {
    token += String.fromCharCode(buffer[i])
    i += 1
  }
  return { token, nextIndex: i }
}

async function parsePgm(filePath) {
  const buffer = await fs.promises.readFile(filePath)
  const magic = buffer.toString('ascii', 0, 2)

  if (magic !== 'P5') {
    throw new Error(`Formato inválido para PGM: ${filePath}`)
  }

  let index = 2
  const token1 = readToken(buffer, index)
  if (!token1) throw new Error('Não foi possível ler o cabeçalho PGM')
  const width = Number(token1.token)
  index = token1.nextIndex

  const token2 = readToken(buffer, index)
  if (!token2) throw new Error('Não foi possível ler o cabeçalho PGM')
  const height = Number(token2.token)
  index = token2.nextIndex

  const token3 = readToken(buffer, index)
  if (!token3) throw new Error('Não foi possível ler o cabeçalho PGM')
  const maxVal = Number(token3.token)
  index = token3.nextIndex

  while (index < buffer.length && /[\s\n\r\t]/.test(String.fromCharCode(buffer[index]))) {
    index += 1
  }

  const pixelBuffer = buffer.slice(index)
  const expectedLength = width * height
  if (pixelBuffer.length < expectedLength) {
    throw new Error(`Dados de imagem incompletos em ${filePath}`)
  }

  return { width, height, maxVal, pixels: pixelBuffer.slice(0, expectedLength) }
}

async function loadImageFromPgm(filePath) {
  const { width, height, pixels } = await parsePgm(filePath)
  const rgbPixels = Buffer.alloc(width * height * 3)

  for (let i = 0; i < width * height; i += 1) {
    const value = pixels[i]
    const offset = i * 3
    rgbPixels[offset] = value
    rgbPixels[offset + 1] = value
    rgbPixels[offset + 2] = value
  }

  const pngBuffer = await sharp(rgbPixels, {
    raw: {
      width,
      height,
      channels: 3
    }
  })
    .png()
    .toBuffer()

  return await canvas.loadImage(pngBuffer)
}

async function loadModels() {
  console.log('🔧 Carregando modelos da face-api.js...')
  await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_DIR)
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_DIR)
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_DIR)
  console.log('✅ Modelos carregados')
}

function getDatasetItems(rootFolder) {
  const labels = fs.readdirSync(rootFolder, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  const items = []
  for (const label of labels) {
    const labelPath = path.join(rootFolder, label)
    const files = fs.readdirSync(labelPath)
      .filter(name => /\.(pgm)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(name => path.join(labelPath, name))

    for (const filePath of files) {
      items.push({ label, filePath })
    }
  }

  return items
}

function splitTrainTest(items) {
  const grouped = items.reduce((acc, item) => {
    acc[item.label] = acc[item.label] || []
    acc[item.label].push(item)
    return acc
  }, {})

  const train = []
  const test = []

  for (const label of Object.keys(grouped)) {
    const images = grouped[label]
    const cut = Math.max(1, Math.floor(images.length * TRAIN_RATIO))
    train.push(...images.slice(0, cut))
    test.push(...images.slice(cut))
  }

  return { train, test }
}

function buildConfusionMatrix(results, labels) {
  const matrix = {}
  for (const actual of labels) {
    matrix[actual] = {}
    for (const predicted of labels) {
      matrix[actual][predicted] = 0
    }
  }

  for (const row of results) {
    const actual = row.label
    const predicted = row.predicted || NO_PREDICTION
    if (!matrix[actual]) {
      matrix[actual] = {}
      for (const label of labels) {
        matrix[actual][label] = 0
      }
    }
    if (!matrix[actual][predicted]) {
      matrix[actual][predicted] = 0
    }
    matrix[actual][predicted] += 1
  }

  return matrix
}

function calculatePrecision(matrix, actualLabels) {
  const precisionPerLabel = {}
  let tpTotal = 0
  let predictedTotal = 0

  for (const label of actualLabels) {
    const tp = matrix[label]?.[label] || 0
    const fp = actualLabels.reduce((sum, actual) => {
      if (actual === label) return sum
      return sum + (matrix[actual]?.[label] || 0)
    }, 0)

    precisionPerLabel[label] = tp + fp === 0 ? 0 : tp / (tp + fp)
    tpTotal += tp
    predictedTotal += tp + fp
  }

  const microPrecision = predictedTotal === 0 ? 0 : tpTotal / predictedTotal
  const macroPrecision = actualLabels.length === 0
    ? 0
    : actualLabels.reduce((sum, label) => sum + precisionPerLabel[label], 0) / actualLabels.length

  return { precisionPerLabel, microPrecision, macroPrecision }
}

function formatConfusionMatrix(matrix, labels) {
  const header = ['actual/predicted', ...labels]
  const lines = [header.join(',')]

  for (const actual of labels) {
    const row = [actual]
    for (const predicted of labels) {
      row.push(matrix[actual]?.[predicted] || 0)
    }
    lines.push(row.join(','))
  }

  return lines
}

function writeCsv(results, accuracy, correct, total, precision, labelPrecision, matrix, labels, precisionLabels = Object.keys(labelPrecision).sort()) {
  const header = ['filePath', 'label', 'predicted', 'correct', 'distance', 'error']
  const lines = [header.join(',')]

  for (const row of results) {
    const values = [
      row.filePath,
      row.label,
      row.predicted,
      row.correct,
      row.distance,
      row.error
    ].map(value => {
      if (value === null || value === undefined) return ''
      const escaped = String(value).replace(/"/g, '""')
      return `"${escaped}"`
    })
    lines.push(values.join(','))
  }

  lines.push('')
  lines.push(`"accuracy","${accuracy.toFixed(2)}%","${correct}/${total}","total_tests","${total}",""`)
  lines.push(`"micro_precision","${precision.microPrecision.toFixed(4)}"`)
  lines.push(`"macro_precision","${precision.macroPrecision.toFixed(4)}"`)
  lines.push('')
  lines.push('"label","precision"')
  for (const label of precisionLabels) {
    const labelPrec = labelPrecision[label] ?? 0
    lines.push(`"${label}","${labelPrec.toFixed(4)}"`)
  }

  lines.push('')
  lines.push('"Confusion Matrix"')
  lines.push(...formatConfusionMatrix(matrix, labels))

  fs.writeFileSync(CSV_OUTPUT_PATH, lines.join('\n'), 'utf8')
}

async function extractDescriptor(filePath) {
  const image = await loadImageFromPgm(filePath)

  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!detection || !detection.descriptor) {
    throw new Error(`Rosto não detectado em ${filePath}`)
  }

  return Array.from(detection.descriptor)
}

async function run() {
  try {
    console.log(`📄 CSV de saída: ${CSV_OUTPUT_PATH}`)
    const allItems = getDatasetItems(DATASET_DIR)
    if (allItems.length === 0) {
      console.error('⚠️  Dataset vazio ou caminho incorreto:', DATASET_DIR)
      process.exit(1)
    }

    await loadModels()

    const { train, test } = splitTrainTest(allItems)
    console.log(`📚 Total de imagens: ${allItems.length}`)
    console.log(`   Treino: ${train.length}`)
    console.log(`   Teste: ${test.length}\n`)

    const trainDescriptors = []
    for (const item of train) {
      try {
        const descriptor = await extractDescriptor(item.filePath)
        trainDescriptors.push({ label: item.label, descriptor })
      } catch (err) {
        console.warn(`⚠️  Ignorando treino ${item.filePath}: ${err.message}`)
      }
    }

    if (trainDescriptors.length === 0) {
      throw new Error('Nenhum descriptor de treino foi extraído.')
    }

    let correct = 0
    let total = 0
    const errors = []
    const testResults = []

    for (const item of test) {
      total += 1
      try {
        const descriptor = await extractDescriptor(item.filePath)
        const nearest = trainDescriptors.reduce((best, candidate) => {
          const dist = calcularDistanciaEuclidiana(candidate.descriptor, descriptor)
          return dist < best.dist ? { label: candidate.label, dist } : best
        }, { label: null, dist: Infinity })

        const predicted = nearest.label
        const isCorrect = predicted === item.label
        if (isCorrect) correct += 1
        else errors.push({ file: item.filePath, expected: item.label, predicted, distance: nearest.dist.toFixed(4) })

        testResults.push({
          filePath: item.filePath,
          label: item.label,
          predicted,
          correct: isCorrect ? 'yes' : 'no',
          distance: nearest.dist.toFixed(4),
          error: ''
        })
      } catch (err) {
        console.warn(`⚠️  Ignorando teste ${item.filePath}: ${err.message}`)
        testResults.push({
          filePath: item.filePath,
          label: item.label,
          predicted: NO_PREDICTION,
          correct: 'no',
          distance: '',
          error: err.message
        })
      }
    }

    const accuracy = total ? (correct / total) * 100 : 0
    const actualLabels = Array.from(new Set(testResults.map(r => r.label))).sort()
    const predictedLabels = Array.from(new Set(testResults.map(r => r.predicted || NO_PREDICTION)))
    const matrixLabels = Array.from(new Set([...actualLabels, ...predictedLabels])).sort()
    const confusionMatrix = buildConfusionMatrix(testResults, matrixLabels)
    const precision = calculatePrecision(confusionMatrix, actualLabels)

    console.log('\n📊 Resultado do teste:')
    console.log(`   Acertos: ${correct}/${total}`)
    console.log(`   Acurácia: ${accuracy.toFixed(2)}%`)
    console.log(`   Precisão micro: ${precision.microPrecision.toFixed(4)}`)
    console.log(`   Precisão macro: ${precision.macroPrecision.toFixed(4)}`)

    console.log('\n🧠 Precisão por classe:')
    for (const label of actualLabels) {
      console.log(`   ${label}: ${precision.precisionPerLabel[label].toFixed(4)}`)
    }

    console.log('\n📊 Matriz de confusão:')
    const matrixHeader = ['actual/predicted', ...matrixLabels]
    console.log(matrixHeader.join('\t'))
    for (const actual of matrixLabels) {
      const row = [actual]
      for (const predicted of matrixLabels) {
        row.push(confusionMatrix[actual]?.[predicted] || 0)
      }
      console.log(row.join('\t'))
    }

    writeCsv(testResults, accuracy, correct, total, precision, precision.precisionPerLabel, confusionMatrix, matrixLabels, actualLabels)
    console.log(`\n💾 Resultados salvos em CSV: ${CSV_OUTPUT_PATH}`)

    if (errors.length > 0) {
      console.log('\n❌ Erros de classificação:')
      for (const err of errors.slice(0, 10)) {
        console.log(`   ${path.basename(err.file)} → esperado=${err.expected}, previsto=${err.predicted}, dist=${err.distance}`)
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('❌ Erro no teste do dataset:', err)
    process.exit(1)
  }
}

run()
