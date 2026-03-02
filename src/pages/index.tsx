// src/pages/index.tsx

import { useMemo, useState, useEffect } from "react";
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
    <div
      style={{
        marginBottom: "2rem",
        padding: "1rem",
        background: "#1e1e1e",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      <h3>{title}</h3>
      {children}
    </div>
  );

  const numberInput = (key: keyof Params) => (
    <div style={{ marginBottom: "1rem" }}>
      <label>{key}</label>
      <br />
      <input
        type="range"
        min={0}
        max={200}
        value={params[key] as number}
        onChange={(e) => handleChange(key, Number(e.target.value))}
        style={{ width: "100%" }}
      />
      <input
        type="number"
        value={params[key] as number}
        onChange={(e) => handleChange(key, Number(e.target.value))}
        style={{ width: 70 }}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem" }}>
      <div style={{ width: 400 }}>
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
          <button onClick={addBoxCutout}>Add Box Cutout</button>
          <button onClick={addCylinderCutout} style={{ marginLeft: 10 }}>
            Add Cylinder Cutout
          </button>
        </Section>

        <button onClick={downloadSTL}>Download STL</button>
      </div>

      <div style={{ width: 600, height: 600 }}>
        {meshData && (
          <Preview vertices={meshData.vertices} indices={meshData.indices} />
        )}
      </div>
    </div>
  );
}
