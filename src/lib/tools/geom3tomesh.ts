import { geom3 } from '@jscad/modeling/src/geometries'

export function geom3ToMesh(geometry: geom3.Geom3) {
  const polygons = geometry.polygons // gives array of polygons
  const vertices: number[] = []
  const indices: number[] = []

  let index = 0
  for (const poly of polygons) {
    // triangulate polygon (fan)
    const verts = poly.vertices
    for (let i = 1; i < verts.length - 1; i++) {
      // triangle: verts[0], verts[i], verts[i+1]
      const tri = [verts[0], verts[i], verts[i + 1]]
      for (const v of tri) {
        vertices.push(v[0], v[1], v[2]) // assuming v = [x, y, z]
      }
      indices.push(index, index + 1, index + 2)
      index += 3
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  }
}