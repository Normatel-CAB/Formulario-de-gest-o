// Recomprime as fotos que ja estao no banco, igual o script do Aplicativo RH.
//
// Por padrao so simula e mostra quanto daria pra ganhar. Com --executar grava,
// e antes de gravar cada ficha salva as fotos originais em backup-fotos/.
//
//   $env:SUPABASE_SERVICE_ROLE_KEY="..."   (Supabase > Project Settings > API)
//   npm run comprimir-fotos                 simula
//   npm run comprimir-fotos -- --executar   grava
//
// a chave service_role passa por cima da RLS, por isso so na variavel do terminal, nunca no .env

import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const TABELA = 'formularios_avaliacao'
const LADO_MAXIMO = 1920
const TAMANHO_MINIMO = 400 * 1024
const GANHO_MINIMO = 0.8

const args = process.argv.slice(2)
const executar = args.includes('--executar')
const pastaBackup = path.resolve(args.find((a) => a.startsWith('--backup='))?.split('=')[1] || 'backup-fotos')

const url = process.env.VITE_SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !chave) {
  console.error('Falta VITE_SUPABASE_URL (vem do .env) ou SUPABASE_SERVICE_ROLE_KEY (defina no terminal).')
  process.exit(1)
}

const supabase = createClient(url, chave, { auth: { persistSession: false } })

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function lerDataUrl(dataUrl) {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl || '')
  if (!m) return null
  return { tipo: m[1].toLowerCase(), buffer: Buffer.from(m[2], 'base64') }
}

function formatoDoTipo(tipo) {
  if (tipo === 'image/jpeg' || tipo === 'image/jpg') return 'jpeg'
  if (tipo === 'image/png') return 'png'
  if (tipo === 'image/webp') return 'webp'
  return null
}

async function comprimir(buffer, formato) {
  const imagem = sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true })
  if (formato === 'jpeg') return imagem.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  if (formato === 'webp') return imagem.webp({ quality: 80 }).toBuffer()
  return imagem.png({ compressionLevel: 9, palette: true, quality: 85 }).toBuffer()
}

async function listarFichasComFoto() {
  const ids = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase
      .from(TABELA)
      .select('id')
      .gt('qtdImagens', 0)
      .order('createdAt')
      .range(de, de + 999)
    if (error) throw error
    ids.push(...data.map((l) => l.id))
    if (data.length < 1000) return ids
  }
}

async function processarFicha(id, log, total) {
  // uma ficha por vez: cada uma pode ter dezenas de MB em base64
  const { data: ficha, error } = await supabase.from(TABELA).select('id,updatedAt,imagens').eq('id', id).single()
  if (error) throw error

  let mudou = false
  const novas = []
  for (const foto of ficha.imagens ?? []) {
    const lido = lerDataUrl(foto.dataUrl)
    const formato = lido && formatoDoTipo(lido.tipo)
    if (!lido || !formato) {
      log.push([id, foto.nome, 0, 0, 'formato nao suportado'])
      novas.push(foto)
      continue
    }
    total.antes += lido.buffer.length
    if (lido.buffer.length < TAMANHO_MINIMO) {
      log.push([id, foto.nome, lido.buffer.length, lido.buffer.length, 'ja pequena'])
      total.depois += lido.buffer.length
      novas.push(foto)
      continue
    }
    let novo
    try {
      novo = await comprimir(lido.buffer, formato)
    } catch (err) {
      log.push([id, foto.nome, lido.buffer.length, lido.buffer.length, `falhou: ${err.message}`])
      total.depois += lido.buffer.length
      total.falhas += 1
      novas.push(foto)
      continue
    }
    if (novo.length >= lido.buffer.length * GANHO_MINIMO) {
      log.push([id, foto.nome, lido.buffer.length, lido.buffer.length, 'sem ganho'])
      total.depois += lido.buffer.length
      novas.push(foto)
      continue
    }
    log.push([id, foto.nome, lido.buffer.length, novo.length, executar ? 'comprimida' : 'simulado'])
    total.depois += novo.length
    total.fotos += 1
    mudou = true
    novas.push({ ...foto, dataUrl: `data:image/${formato};base64,${novo.toString('base64')}` })
  }

  if (!mudou || !executar) return

  fs.mkdirSync(pastaBackup, { recursive: true })
  fs.writeFileSync(path.join(pastaBackup, `${id}.json`), JSON.stringify(ficha.imagens))

  // updatedAt nao muda pra ficha nao pular pro topo das listas. O filtro por ele
  // evita apagar foto que alguem tenha trocado enquanto o script rodava.
  const { data: gravadas, error: erroGravar } = await supabase
    .from(TABELA)
    .update({ imagens: novas })
    .eq('id', id)
    .eq('updatedAt', ficha.updatedAt)
    .select('id')
  if (erroGravar) throw erroGravar
  if (gravadas.length === 0) log.push([id, '', 0, 0, 'ficha mudou durante o script, ficou como estava'])
}

const ids = await listarFichasComFoto()
console.log(`${ids.length} fichas com foto. ${executar ? 'GRAVANDO' : 'Simulação (use --executar pra gravar)'}`)

const log = []
const total = { antes: 0, depois: 0, fotos: 0, falhas: 0 }
for (const [i, id] of ids.entries()) {
  try {
    await processarFicha(id, log, total)
  } catch (err) {
    total.falhas += 1
    log.push([id, '', 0, 0, `erro na ficha: ${err.message}`])
  }
  if ((i + 1) % 10 === 0 || i + 1 === ids.length) {
    console.log(`  ${i + 1}/${ids.length}  ${mb(total.antes)} -> ${mb(total.depois)}`)
  }
}

fs.mkdirSync(pastaBackup, { recursive: true })
const csv = ['ficha;foto;bytes_antes;bytes_depois;resultado', ...log.map((l) => l.join(';'))].join('\n')
fs.writeFileSync(path.join(pastaBackup, executar ? 'relatorio.csv' : 'simulacao.csv'), csv)

const ganho = total.antes ? Math.round((1 - total.depois / total.antes) * 100) : 0
console.log(`\nFotos ${executar ? 'comprimidas' : 'que seriam comprimidas'}: ${total.fotos}`)
console.log(`Peso das fotos: ${mb(total.antes)} -> ${mb(total.depois)} (${ganho}% a menos, sem contar o base64)`)
console.log(`Falhas: ${total.falhas}. Relatório em ${pastaBackup}`)
