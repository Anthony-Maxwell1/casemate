// src/lib/templates/cube.ts
import { cuboid } from '@jscad/modeling/src/primitives'
import { geom3 } from '@jscad/modeling/src/geometries'

export interface Params {
  width: number
  height: number
  depth: number
}

// Returns a JSCAD geometry
export function build(params: Params): geom3.Geom3 {
  return cuboid({ size: [params.width, params.height, params.depth] })
}