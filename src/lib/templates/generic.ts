// src/lib/templates/cube.ts
import { roundedCuboid } from '@jscad/modeling/src/primitives'
import { geom3 } from '@jscad/modeling/src/geometries'
import { translate } from '@jscad/modeling/src/operations/transforms'
import { subtract } from '@jscad/modeling/src/operations/booleans'

export interface Params {
  width: number
  height: number
  depth: number
  innerWidth: number
  innerHeight: number
  innerDepth: number
  innerOffset?: [number, number, number] // Defaults to center, however if provided will be relative to top (x) bottom (y) left (z) corner of the cube
radius?: number
innerRadius?: number
}

interface ResolvedParams {
    width: number
    height: number
    depth: number
    innerWidth: number
    innerHeight: number
    innerDepth: number
    innerOffset: [number, number, number],
radius: number
innerRadius: number
}

function ResolveParams(params: Params): ResolvedParams {
    let resolved = params as ResolvedParams

    if (!resolved.innerOffset) {
        resolved.innerOffset = [
            (resolved.width - resolved.innerWidth) / 2,
            (resolved.height - resolved.innerHeight) / 2,
            (resolved.depth - resolved.innerDepth) / 2
        ]
    }

    if (!resolved.radius) resolved.radius = 0
    if (!resolved.innerRadius) resolved.innerRadius = resolved.radius

    return resolved
}

// Returns a JSCAD geometry
export function build(params: Params): geom3.Geom3 {
    const resolvedParams = ResolveParams(params);

    let outer = roundedCuboid({
        size: [resolvedParams.width, resolvedParams.height, resolvedParams.depth],
        roundRadius: resolvedParams.radius
    });

    let inner = roundedCuboid({
        size: [resolvedParams.innerWidth, resolvedParams.innerHeight, resolvedParams.innerDepth],
        roundRadius: resolvedParams.innerRadius
    });

    inner = translate(resolvedParams.innerOffset, inner) as geom3.Geom3;

    return subtract(outer, inner); // now subtract is geometry-aware
}