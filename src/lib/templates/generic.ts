// src/lib/templates/generic.ts

import {
  roundedCuboid,
  cuboid,
  cylinder,
} from "@jscad/modeling/src/primitives";
import { geom3 } from "@jscad/modeling/src/geometries";
import {
  translate,
  rotateX,
  rotateY,
} from "@jscad/modeling/src/operations/transforms";
import { subtract, union } from "@jscad/modeling/src/operations/booleans";

export type Cutout =
  | {
      type: "box";
      size: [number, number, number];
      position: [number, number, number]; // relative to outer MIN corner
    }
  | {
      type: "cylinder";
      radius: number;
      height: number;
      position: [number, number, number]; // base center relative to outer MIN corner
      axis?: "x" | "y" | "z";
    };

export interface Params {
  width: number;
  height: number;
  depth: number;

  innerWidth: number;
  innerHeight: number;
  innerDepth: number;

  lipHeight: number;
  lipInset: number;

  radius?: number;
  innerRadius?: number;

  cutouts: Cutout[];
}

export function build(params: Params): geom3.Geom3 {
  const {
    width,
    height,
    depth,
    innerWidth,
    innerHeight,
    innerDepth,
    lipHeight,
    lipInset,
    radius = 0,
    innerRadius = radius,
    cutouts,
  } = params;

  // Outer shell (centered)
  const outer = roundedCuboid({
    size: [width, height, depth],
    roundRadius: radius,
  });

  // Inner cavity (offset from TOP = Y+)
  const rounded = roundedCuboid({
    size: [innerWidth, innerHeight, innerDepth],
    roundRadius: innerRadius,
  })
  
  const solid = translate([0, innerRadius, 0], cuboid({
    size: [innerWidth, innerHeight-innerRadius, innerDepth],
  }));

  const inner = union(rounded, solid)

  const innerTranslated = translate(
    [0, height / 2 - innerHeight / 2, 0],
    inner,
  );

  let body = subtract(outer, innerTranslated);

  // Lip
  if (lipHeight > 0) {
    const lip = roundedCuboid({
      size: [width, height + lipHeight, depth],
      roundRadius: radius,
    });

    const step = subtract(lip, outer);
    const step2 = subtract(step, cuboid({
      size: [innerWidth-lipInset, height+lipHeight, innerDepth-lipInset],
    }))

    // const lipTranslated = translate([0, height / 2 - lipHeight / 2, 0], step2);

    // const finalLip = subtract(lipTranslated, innerTranslated);

    body = union(body, step2);
  }

  const minCorner = [-width / 2, -height / 2, -depth / 2];

  for (const cut of cutouts) {
    if (cut.type === "box") {
      const box = cuboid({ size: cut.size });

      const translated = translate(
        [
          minCorner[0] + cut.position[0] + cut.size[0] / 2,
          minCorner[1] + cut.position[1] + cut.size[1] / 2,
          minCorner[2] + cut.position[2] + cut.size[2] / 2,
        ],
        box,
      );

      body = subtract(body, translated);
    }

    if (cut.type === "cylinder") {
      let cyl = cylinder({
        radius: cut.radius,
        height: cut.height,
        segments: 64,
      });

      if (cut.axis === "x") cyl = rotateY(Math.PI / 2, cyl);
      if (cut.axis === "z") cyl = rotateX(Math.PI / 2, cyl);

      const translated = translate(
        [
          minCorner[0] + cut.position[0],
          minCorner[1] + cut.position[1],
          minCorner[2] + cut.position[2],
        ],
        cyl,
      );

      body = subtract(body, translated);
    }
  }

  return body;
}
