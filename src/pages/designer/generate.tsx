import { useState, useEffect } from "react";
import { Phone, Cutout as PhoneCutout } from "../designer";
import { Params, Cutout, build } from "@/lib/templates/generic";
import { geom3ToMesh } from "@/lib/tools/geom3tomesh";
import { Preview } from "@/components/Preview";

export default function Generate() {
  const [phone, setPhone] = useState<Phone | null>(null);
  const [generatedParams, setGeneratedParams] = useState<Params | null>(null);
  const [meshData, setMeshData] = useState<any>(null);

  useEffect(() => {
    // JSCAD case coordinate system:
    //   X = case width  (phone width + 10)
    //   Y = case height (phone depth + 10)  — thickness; back wall at Y-, open at Y+
    //   Z = case depth  (phone height + 10) — tall direction
    // Phone origin from case minCorner: (wall, 2*wall, wall) = (5, 10, 5)
    // Cutout positions are relative to the case minCorner.
    //   Box:      build translates to center = minCorner + position + size/2
    //   Cylinder: build translates to center = minCorner + position
    // Axis mapping in generic.ts:
    //   "x" → rotateY → cylinder along X   (for left/right face cuts)
    //   "z" → rotateX → cylinder along Y   (for back face cuts)
    //   "y" / default → no rotation → along Z

    const wall = 5;

    function toCutout(
      obj: PhoneCutout,
      caseDims: { width: number; height: number; depth: number },
    ): Cutout {
      const px = obj.position[0]; // phone X (along width)
      const py = obj.position[1]; // phone Y (along height)
      // Inner cavity center Y from minCorner
      const innerCenterY = (caseDims.height + 10) / 2;

      if (obj.shape === "circle") {
        const r = obj.radius ?? 5;
        const h = 30; // generous cut-through

        switch (obj.face) {
          case "left":
            return {
              type: "cylinder",
              radius: r,
              height: h,
              position: [0, innerCenterY, wall + py],
              axis: "x",
            };
          case "right":
            return {
              type: "cylinder",
              radius: r,
              height: h,
              position: [caseDims.width, innerCenterY, wall + py],
              axis: "x",
            };
          case "back":
          default:
            return {
              type: "cylinder",
              radius: r,
              height: h,
              position: [wall + px, 0, wall + py],
              axis: "z",
            };
        }
      } else {
        // box cutout
        const sw = obj.size?.[0] ?? 5;
        const sh = obj.size?.[1] ?? 10;

        switch (obj.face) {
          case "left":
            // Cut through X wall; sw along Y (depth), sh along Z (height)
            return {
              type: "box",
              size: [20, sw, sh],
              position: [-10, innerCenterY - sw / 2, wall + py - sh / 2],
            };
          case "right":
            // Cut through X wall from the right side
            return {
              type: "box",
              size: [20, sw, sh],
              position: [
                caseDims.width - 10,
                innerCenterY - sw / 2,
                wall + py - sh / 2,
              ],
            };
          case "back":
          default:
            // Cut through Y wall (back); sw along X, sh along Z
            return {
              type: "box",
              size: [sw, 20, sh],
              position: [wall + px - sw / 2, -5, wall + py - sh / 2],
            };
        }
      }
    }

    function generateParams(phone_: Phone = phone!): Params {
      const { width, height, depth, cameras, buttons } = phone_;
      const caseWidth = width + 10;
      const caseHeight = depth + 10;
      const caseDepth = height + 10;
      const caseDims = {
        width: caseWidth,
        height: caseHeight,
        depth: caseDepth,
      };

      const cameraCutouts = cameras.map(
        (c): PhoneCutout => ({
          shape: c.shape,
          position: c.position,
          radius: c.radius,
          face: "back",
        }),
      );

      const buttonCutouts = buttons.map(
        (b): PhoneCutout => ({
          shape: b.shape,
          position: b.position,
          size: b.size,
          face:
            b.position[0] <= width * 0.3
              ? "left"
              : b.position[0] >= width * 0.7
                ? "right"
                : "back",
        }),
      );

      return {
        width: caseWidth,
        height: caseHeight,
        depth: caseDepth,

        innerWidth: width,
        innerHeight: depth,
        innerDepth: height,

        lipHeight: 5,
        lipInset: 2,

        radius: 1,

        cutouts: [
          ...cameraCutouts.map((c) => toCutout(c, caseDims)),
          ...buttonCutouts.map((b) => toCutout(b, caseDims)),
        ],
      };
    }
    const params = new URLSearchParams(window.location.search);
    const phoneParam = params.get("phone");
    if (phoneParam) {
      const parsedPhone = JSON.parse(phoneParam);
      setPhone(parsedPhone);
      const newParams = generateParams(parsedPhone);
      setGeneratedParams(newParams);

      const geom = build(newParams);
      const mesh = geom3ToMesh(geom);
      setMeshData(mesh);
    } else {
      window.location.href = "/designer";
    }
  }, []);
  return (
    <div className="p-8">
      {(generatedParams && (
        <div>
          <h3>Case Generated</h3>
          <div className="w-xl h-xl">
            {meshData && (
              <Preview
                vertices={meshData.vertices}
                indices={meshData.indices}
              />
            )}
          </div>
        </div>
      )) || (
        <div>
          <h1 className="text-2xl font-bold">Generating...</h1>
          <p className="mt-4 text-gray-400">
            Your case is being generated. This may take a minute.
          </p>
        </div>
      )}
    </div>
  );
}
