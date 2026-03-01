// src/pages/index.tsx
import { useState, useEffect } from 'react'
import { Preview } from '@/components/Preview'
import { Params, build } from '../lib/templates/generic'
// @ts-ignore
import { serialize } from '@jscad/stl-serializer'
import { geom3ToMesh } from '../lib/tools/geom3tomesh'

export default function Home() {
  const [params, setParams] = useState<Params>({
    width: 50,
    height: 50,
    depth: 50,
    innerWidth: 30,
    innerHeight: 30,
    innerDepth: 30,
    radius: 5,
    innerRadius: 2,
  })

  const [geometry, setGeometry] = useState<any>(null)
  const [meshData, setMeshData] = useState<{ vertices: Float32Array; indices: Uint32Array } | null>(null)
  const [stl, setStl] = useState<Blob | null>(null)

  useEffect(() => {
    // Build cube geometry
    const geom = build(params)
    setGeometry(geom)

    // Convert to mesh for Three.js rendering
    const mesh = geom3ToMesh(geom)
    setMeshData(mesh)

    // Export STL
    const stlData = serialize({}, geom)
    setStl(new Blob(stlData, { type: 'application/sla' }))
  }, [params])

  const handleChange = (key: keyof Params, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const downloadSTL = () => {
    if (!stl) return
    const url = URL.createObjectURL(stl)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cube.stl'
    a.click()
    URL.revokeObjectURL(url)
  }

  const controls: (keyof Params)[] = [
    'width',
    'height',
    'depth',
    'innerWidth',
    'innerHeight',
    'innerDepth',
    'radius',
    'innerRadius',
  ]

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
      <div>
        <h2>Controls</h2>
        {controls.map((key) => (
  <div key={key} style={{ marginBottom: '1rem' }}>
    <label>{key}</label>
    <input
      type="range"
      min={0}
      max={200}
      value={typeof params[key] === 'number' ? params[key] : 0}
      onChange={(e) => handleChange(key, Number(e.target.value))}
    />
    <span style={{ marginLeft: '0.5rem' }}>{params[key]}</span>
  </div>
))}
        <button onClick={downloadSTL}>Download STL</button>
      </div>
      <div style={{ width: 500, height: 500 }}>
        {meshData && <Preview vertices={meshData.vertices} indices={meshData.indices} />}
      </div>
    </div>
  )
}