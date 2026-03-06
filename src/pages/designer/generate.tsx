import { useState, useEffect } from "react";
import { Phone, Cutout as PhoneCutout } from "../designer";
import { Params, Cutout, build } from "@/lib/templates/generic";
import { geom3ToMesh } from "@/lib/tools/geom3tomesh";
import { Preview } from "@/components/Preview";

export default function Generate() {
  const [phone, setPhone] = useState<Phone | null>(null);
  const [generatedParams, setGeneratedParams] = useState<Params | null>(null);
  const [meshData, setMeshData] = useState<any>(null);
  const [caseWidth, setCaseWidth] = useState(0);
  const [caseHeight, setCaseHeight] = useState(0);
  const [caseDepth, setCaseDepth] = useState(0);
  const [thickness, setThickness] = useState(10);
  const [lipHeight, setLipHeight] = useState(5);
  const [lipInset, setLipInset] = useState(2);
  const [radius, setRadius] = useState(1);

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

    function generateParams(phone_: Phone = phone!, init: boolean = false): Params {
      const { width, height, depth, cameras, buttons } = phone_;

      if (init) {
        setCaseWidth(width + thickness);
        setCaseHeight(depth + thickness);
        setCaseDepth(height + thickness);
      }

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
        width: init ? width + thickness : caseWidth,
        height: init ? depth + thickness : caseHeight,
        depth: init ? height + thickness : caseDepth,

        innerWidth: width,
        innerHeight: depth,
        innerDepth: height,

        lipHeight,
        lipInset,

        radius,

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
      const newParams = generateParams(parsedPhone, true);
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
          <div className="w-full h-full absolute left-0 top-0 -z-10">
            {meshData && (
              <Preview
                vertices={meshData.vertices}
                indices={meshData.indices}
              />
            )}
          </div>
          <div className="w-96 bg-gray-50 rounded-xl p-4 shadow-lg border border-gray-200">
            <h2>Customize</h2>
            <label>Rounded edges</label>
            <select>
              <option value="0">None</option>
              <option value="1">Light</option>
              <option value="2">Medium</option>
              <option value="3">Heavy</option>
            </select>
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
