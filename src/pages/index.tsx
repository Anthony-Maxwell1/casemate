// src/pages/index.tsx

import { useState, useEffect } from "react";
import { Preview } from "@/components/Preview";
import { Params, build, Cutout } from "../lib/templates/generic";
// @ts-ignore
import { serialize } from "@jscad/stl-serializer";
import { geom3ToMesh } from "../lib/tools/geom3tomesh";

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default function Home() {
  const [params, setParams] = useState<Params>({
    width: 100,
    height: 60,
    depth: 100,

    innerWidth: 90,
    innerHeight: 40,
    innerDepth: 90,

    lipHeight: 5,
    lipInset: 2,

    radius: 5,
    innerRadius: 2,

    cutouts: [],
  });

  const [meshData, setMeshData] = useState<any>(null);
  const [stl, setStl] = useState<Blob | null>(null);
  const debouncedParams = useDebounced(params, 120);

  useEffect(() => {
    const geom = build(debouncedParams);
    const mesh = geom3ToMesh(geom);
    setMeshData(mesh);

    const stlData = serialize({}, geom);
    setStl(new Blob(stlData, { type: "application/sla" }));
  }, [debouncedParams]);

  const handleChange = (key: keyof Params, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const addBoxCutout = () => {
    const cut: Cutout = {
      type: "box",
      size: [20, 20, 20],
      position: [0, 0, 0],
    };

    setParams((p) => ({ ...p, cutouts: [...p.cutouts, cut] }));
  };

  const addCylinderCutout = () => {
    const cut: Cutout = {
      type: "cylinder",
      radius: 10,
      height: 20,
      position: [0, 0, 0],
      axis: "y",
    };

    setParams((p) => ({ ...p, cutouts: [...p.cutouts, cut] }));
  };

  const downloadSTL = () => {
    if (!stl) return;
    const url = URL.createObjectURL(stl);
    const a = document.createElement("a");
    a.href = url;
    a.download = "case.stl";
    a.click();
    URL.revokeObjectURL(url);
  };

  const Section = ({ title, children }: any) => (
    <div className="mb-8 p-4 bg-gray-100 rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4">{title}</h3>
      {children}
    </div>
  );

  const numberInput = (key: keyof Params) => (
    <div className="mb-4">
      <label className="block font-semibold text-sm mb-2">{key}</label>
      <input
        type="range"
        min={0}
        max={200}
        value={params[key] as number}
        onChange={(e) => handleChange(key, Number(e.target.value))}
        className="w-full mb-2"
      />
      <input
        type="number"
        value={params[key] as number}
        onChange={(e) => handleChange(key, Number(e.target.value))}
        className="w-16 px-2 py-1 border border-gray-300 rounded"
      />
    </div>
  );

  return (
    <div className="flex gap-8 p-8 bg-white min-h-screen">
      <div className="w-96">
        <Section title="Outer Dimensions">
          {numberInput("width")}
          {numberInput("height")}
          {numberInput("depth")}
          {numberInput("radius")}
        </Section>

        <Section title="Inner Cavity">
          {numberInput("innerWidth")}
          {numberInput("innerHeight")}
          {numberInput("innerDepth")}
          {numberInput("innerRadius")}
        </Section>

        <Section title="Lip">
          {numberInput("lipHeight")}
          {numberInput("lipInset")}
        </Section>

        <Section title="Cutouts">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add Box Cutout
          </button>
          <button onClick={addCylinderCutout} className="ml-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add Cylinder Cutout
          </button>
        </Section>

        <button onClick={downloadSTL} className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold">
          Download STL
        </button>
      </div>

      <div className="w-full h-full bg-gray-50 rounded-lg shadow-md">
        {meshData && (
          <Preview vertices={meshData.vertices} indices={meshData.indices} />
        )}
      </div>
    </div>
  );
}
